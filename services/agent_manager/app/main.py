import os
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.exc import SQLAlchemyError
from qdrant_client import QdrantClient

from services.agent_manager.app.semantic_planner import SemanticPlanner
from services.agent_manager.app.models import Base, Project
from services.agent_manager.app.core.config import setup_logging
from services.agent_manager.app.core.exceptions import (
    BaseAgentException,
    ProjectNotFoundError,
    TaskValidationError,
    InfrastructureError,
)
from services.agent_manager.app.memory.reporter import report_to_memory
from services.message_broker.rabbitmq_client import RabbitMQClient
from services.message_broker.message_schema import MESSAGE_SCHEMA

setup_logging()
logger = logging.getLogger(__name__)

qdrant_client = QdrantClient(host=os.getenv("QDRANT_HOST"), port=os.getenv("QDRANT_PORT"))
planner = SemanticPlanner()

DATABASE_URL = (
    f"postgresql+asyncpg://{os.getenv('POSTGRES_USER', 'jules')}:{os.getenv('POSTGRES_PASSWORD', 'jules')}@"
    f"{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/{os.getenv('POSTGRES_DB', 'jules_db')}"
)
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

rabbitmq_client = RabbitMQClient(
    host=os.getenv("RABBITMQ_HOST", "localhost"),
    port=int(os.getenv("RABBITMQ_PORT", 5672)),
    username=os.getenv("RABBITMQ_DEFAULT_USER", "user"),
    password=os.getenv("RABBITMQ_DEFAULT_PASS", "password")
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Agent Manager is starting up.")
    await init_db()
    logger.info("Database initialized.")
    rabbitmq_client.connect()
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, consume_project_tasks)
    loop.run_in_executor(None, consume_manager_notifications)
    yield
    logger.info("Agent Manager is shutting down.")
    rabbitmq_client.close()

app = FastAPI(lifespan=lifespan)

def consume_project_tasks():
    rabbitmq_client.consume_messages('project_tasks', handle_project_creation_task)

def consume_manager_notifications():
    rabbitmq_client.consume_messages('manager_notifications', handle_task_completion_notification)

def handle_project_creation_task(message: dict):
    # This is a synchronous wrapper to call the async handler
    asyncio.run(async_handle_project_creation_task(message))

async def async_handle_project_creation_task(message: dict):
    project_data = message.get('payload')
    project_name = project_data.get('name')
    if not project_name:
        raise TaskValidationError("Project name is missing from project creation data.", details=project_data)

    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(Project).where(Project.name == project_name))
            if result.scalar_one_or_none():
                logger.warning("Project creation ignored, project already exists.", extra={"props": {"project_name": project_name}})
                return

            report_to_memory(rabbitmq_client, project_name, "agent_manager", "project_creation_received", {"requirements": project_data.get('requirements', '')})

            new_project = Project(name=project_name, requirements=project_data.get('requirements', ''))
            session.add(new_project)
            await session.commit()
            await session.refresh(new_project)

            execution_plan = planner.generate_plan(new_project.requirements)
            report_to_memory(rabbitmq_client, project_name, "agent_manager", "plan_generated", {"plan": execution_plan})

            new_project.state = {"plan": execution_plan, "completed_task_ids": [], "dispatched_task_ids": [], "artifacts": {}}
            new_project.status = "in_progress"
            await session.commit()

            if execution_plan:
                initial_tasks = [task for task in execution_plan if not task.get('depends_on')]
                for task in initial_tasks:
                    task_to_dispatch = task.copy()
                    task_to_dispatch['project_name'] = new_project.name
                    task_to_dispatch['requirements'] = new_project.requirements
                    agent_name = task_to_dispatch['agent']
                    dispatch_queue = f"{agent_name}_tasks"

                    msg = RabbitMQClient.create_message(
                        source_agent='agent_manager',
                        target_agent=agent_name,
                        task_type='execute_task',
                        payload=task_to_dispatch
                    )
                    rabbitmq_client.publish_message(dispatch_queue, msg)
                    report_to_memory(rabbitmq_client, project_name, "agent_manager", "task_dispatched", {"task": task_to_dispatch})
        except SQLAlchemyError as e:
            raise InfrastructureError("database", e)

def handle_task_completion_notification(message: dict):
    # Synchronous wrapper
    asyncio.run(async_handle_task_completion_notification(message))

async def async_handle_task_completion_notification(message: dict):
    notification_data = message.get('payload')
    project_name = notification_data.get('project_name')
    completed_task_id = notification_data.get('task_id')
    agent_name = notification_data.get('agent')

    if not project_name or not completed_task_id:
        raise TaskValidationError("Project name or completed task ID missing from notification.", details=notification_data)

    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(Project).where(Project.name == project_name))
            project = result.scalar_one_or_none()
            if not project:
                raise ProjectNotFoundError(project_name)

            report_to_memory(rabbitmq_client, project.name, "agent_manager", "task_completion_received", {"completed_task_id": completed_task_id, "source_agent": agent_name})

            state = project.state
            plan = state.get("plan", [])
            completed_ids = set(state.get("completed_task_ids", []))

            if completed_task_id not in completed_ids:
                completed_ids.add(completed_task_id)
                state["completed_task_ids"] = sorted(list(completed_ids))

            artifacts = notification_data.get("artifacts", [])
            if artifacts:
                state.setdefault("artifacts", {})[str(completed_task_id)] = artifacts
                report_to_memory(rabbitmq_client, project.name, "agent_manager", "artifacts_stored", {"task_id": completed_task_id, "artifacts": artifacts})

            if agent_name in ["code_reviewer", "security_agent"] and artifacts:
                review_artifact = artifacts[0]
                if review_artifact.get("status") == "REJECTED":
                    await handle_rejection(session, project, completed_task_id, review_artifact)
                    flag_modified(project, "state")
                    await session.commit()
                    return

            dispatched_ids = set(state.get("dispatched_task_ids", []))
            active_ids = completed_ids.union(dispatched_ids)
            runnable_tasks = [task for task in plan if task.get('task_id') not in active_ids]
            newly_dispatchable_tasks = [task for task in runnable_tasks if set(task.get('depends_on', [])).issubset(completed_ids)]

            if newly_dispatchable_tasks:
                all_artifacts = [artifact for task_artifacts in state.get("artifacts", {}).values() for artifact in task_artifacts]
                for task in newly_dispatchable_tasks:
                    dispatched_ids.add(task.get('task_id'))
                    task_to_dispatch = task.copy()
                    task_to_dispatch.update({'project_name': project.name, 'requirements': project.requirements, 'context_artifacts': all_artifacts})
                    dispatch_queue = f"{task['agent']}_tasks"

                    msg = RabbitMQClient.create_message(
                        source_agent='agent_manager',
                        target_agent=task['agent'],
                        task_type='execute_task',
                        payload=task_to_dispatch
                    )
                    rabbitmq_client.publish_message(dispatch_queue, msg)
                    report_to_memory(rabbitmq_client, project.name, "agent_manager", "task_dispatched", {"task": task_to_dispatch})

            state["dispatched_task_ids"] = sorted(list(dispatched_ids))

            if len(completed_ids) == len(plan):
                project.status = 'completed'
                report_to_memory(rabbitmq_client, project.name, "agent_manager", "project_completed", {})
            else:
                project.status = 'in_progress'

            flag_modified(project, "state")
            await session.commit()
        except SQLAlchemyError as e:
            raise InfrastructureError("database", e)


async def handle_rejection(session: AsyncSession, project: Project, failed_task_id: int, review_artifact: dict):
    state = project.state
    plan = state.get("plan", [])

    failed_task = next((t for t in plan if t.get("task_id") == failed_task_id), None)
    if not failed_task:
        logger.error(f"Could not find failed task with ID {failed_task_id} in plan for project {project.name}")
        return

    max_task_id = max(t["task_id"] for t in plan) if plan else 0
    remediation_task_id = max_task_id + 1

    remediation_description = (
        f"Remediation required. The '{failed_task['agent']}' agent rejected the previous submission. "
        f"Summary: {review_artifact.get('summary', 'No summary provided.')}\n\n"
        f"Please address the following issues:\n{json.dumps(review_artifact.get('details', review_artifact.get('issues', 'No details provided')), indent=2)}"
    )

    remediation_task = {
        "task_id": remediation_task_id,
        "agent": "developer_agent",
        "description": remediation_description,
        "depends_on": [failed_task_id]
    }
    plan.append(remediation_task)

    for task in plan:
        if failed_task_id in task.get("depends_on", []):
            task["depends_on"].remove(failed_task_id)
            task["depends_on"].append(remediation_task_id)

    state["plan"] = plan
    dispatched_ids = set(state.get("dispatched_task_ids", []))
    dispatched_ids.add(remediation_task_id)
    state["dispatched_task_ids"] = sorted(list(dispatched_ids))

    all_artifacts = [artifact for task_artifacts in state.get("artifacts", {}).values() for artifact in task_artifacts]
    task_to_dispatch = remediation_task.copy()
    task_to_dispatch.update({
        'project_name': project.name,
        'requirements': project.requirements,
        'context_artifacts': all_artifacts
    })

    dispatch_queue = f"{remediation_task['agent']}_tasks"
    message = RabbitMQClient.create_message(
        source_agent='agent_manager',
        target_agent=remediation_task['agent'],
        task_type='remediation_task',
        payload=task_to_dispatch
    )
    rabbitmq_client.publish_message(dispatch_queue, message)

    report_to_memory(rabbitmq_client, project.name, "agent_manager", "remediation_task_dispatched", {"task": task_to_dispatch})
    logger.info("Dispatched remediation task.", extra={"props": {"project_name": project.name, "task_id": remediation_task_id}})


@app.get("/health")
def read_health():
    return {"status": "ok"}
