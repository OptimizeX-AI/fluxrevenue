import os
import redis.asyncio as redis
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

setup_logging()
logger = logging.getLogger(__name__)

redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=int(os.getenv("REDIS_PORT", 6379)), db=0)
qdrant_client = QdrantClient(host=os.getenv("QDRANT_HOST"), port=os.getenv("QDRANT_PORT"))
planner = SemanticPlanner()

DATABASE_URL = (
    f"postgresql+asyncpg://{os.getenv('POSTGRES_USER', 'jules')}:{os.getenv('POSTGRES_PASSWORD', 'jules')}@"
    f"{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/{os.getenv('POSTGRES_DB', 'jules_db')}"
)
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Agent Manager is starting up.")
    await init_db()
    logger.info("Database initialized.")
    subscriber_task = asyncio.create_task(async_redis_subscriber(redis_client))
    yield
    logger.info("Agent Manager is shutting down.")
    subscriber_task.cancel()
    try:
        await subscriber_task
    except asyncio.CancelledError:
        logger.info("Redis subscriber task cancelled successfully.")

app = FastAPI(lifespan=lifespan)

async def handle_project_creation_task(project_data: dict, redis_client):
    project_name = project_data.get('name')
    if not project_name:
        raise TaskValidationError("Project name is missing from project creation data.", details=project_data)

    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(Project).where(Project.name == project_name))
            if result.scalar_one_or_none():
                logger.warning("Project creation ignored, project already exists.", extra={"props": {"project_name": project_name}})
                return

            await report_to_memory(redis_client, project_name, "agent_manager", "project_creation_received", {"requirements": project_data.get('requirements', '')})

            new_project = Project(name=project_name, requirements=project_data.get('requirements', ''))
            session.add(new_project)
            await session.commit()
            await session.refresh(new_project)

            execution_plan = planner.generate_plan(new_project.requirements)
            await report_to_memory(redis_client, project_name, "agent_manager", "plan_generated", {"plan": execution_plan})

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
                    dispatch_channel = f"{agent_name}_tasks"
                    await redis_client.publish(dispatch_channel, json.dumps(task_to_dispatch))
                    await report_to_memory(redis_client, project_name, "agent_manager", "task_dispatched", {"task": task_to_dispatch})
        except SQLAlchemyError as e:
            raise InfrastructureError("database", e)

async def handle_task_completion_notification(notification_data: dict, redis_client):
    project_name = notification_data.get('project_name')
    completed_task_id = notification_data.get('task_id')

    if not project_name or not completed_task_id:
        raise TaskValidationError("Project name or completed task ID missing from notification.", details=notification_data)

    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(Project).where(Project.name == project_name))
            project = result.scalar_one_or_none()
            if not project:
                raise ProjectNotFoundError(project_name)

            await report_to_memory(redis_client, project.name, "agent_manager", "task_completion_received", {"completed_task_id": completed_task_id, "source_agent": notification_data.get("agent")})

            state = project.state
            plan = state.get("plan", [])
            completed_ids = set(state.get("completed_task_ids", []))
            dispatched_ids = set(state.get("dispatched_task_ids", []))

            if completed_task_id not in completed_ids:
                completed_ids.add(completed_task_id)
                state["completed_task_ids"] = sorted(list(completed_ids))

            if "artifacts" in notification_data and notification_data["artifacts"]:
                state.setdefault("artifacts", {})[str(completed_task_id)] = notification_data["artifacts"]
                await report_to_memory(redis_client, project.name, "agent_manager", "artifacts_stored", {"task_id": completed_task_id, "artifacts": notification_data["artifacts"]})

            active_ids = completed_ids.union(dispatched_ids)
            runnable_tasks = [task for task in plan if task.get('task_id') not in active_ids]
            newly_dispatchable_tasks = [task for task in runnable_tasks if set(task.get('depends_on', [])).issubset(completed_ids)]

            if newly_dispatchable_tasks:
                all_artifacts = [artifact for task_artifacts in state.get("artifacts", {}).values() for artifact in task_artifacts]
                for task in newly_dispatchable_tasks:
                    dispatched_ids.add(task.get('task_id'))
                    task_to_dispatch = task.copy()
                    task_to_dispatch.update({'project_name': project.name, 'requirements': project.requirements, 'context_artifacts': all_artifacts})
                    agent_name = task_to_dispatch['agent']
                    dispatch_channel = f"{agent_name}_tasks"
                    await redis_client.publish(dispatch_channel, json.dumps(task_to_dispatch))
                    await report_to_memory(redis_client, project.name, "agent_manager", "task_dispatched", {"task": task_to_dispatch})

            state["dispatched_task_ids"] = sorted(list(dispatched_ids))

            if len(completed_ids) == len(plan):
                project.status = 'completed'
                await report_to_memory(redis_client, project.name, "agent_manager", "project_completed", {})
                try:
                    final_artifact = state.get("artifacts", {}).get(str(completed_task_id), [{}])[0]
                    if final_artifact.get("type") == "project_archive":
                        export_info = {"project_name": project.name, "archive_path": final_artifact.get("path")}
                        with open("workspace/pending_exports.log", "a") as f:
                            f.write(json.dumps(export_info) + "\n")
                        await report_to_memory(redis_client, project.name, "agent_manager", "project_export_ready", export_info)
                except Exception as e:
                    logger.error("Failed to write to export log.", exc_info=True)
            else:
                project.status = 'in_progress'

            flag_modified(project, "state")
            await session.commit()
        except SQLAlchemyError as e:
            raise InfrastructureError("database", e)

async def async_redis_subscriber(redis_client):
    channel_name_tasks = "project_tasks"
    channel_name_notifications = "manager_notifications"
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(channel_name_tasks, channel_name_notifications)
    logger.info("Subscribed to Redis channels.", extra={"props": {"channels": [channel_name_tasks, channel_name_notifications]}})

    while True:
        try:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if not message:
                await asyncio.sleep(0.01)
                continue

            channel = message['channel'].decode('utf-8')
            data = json.loads(message['data'])

            if channel == channel_name_tasks:
                await handle_project_creation_task(data, redis_client)
            elif channel == channel_name_notifications:
                await handle_task_completion_notification(data, redis_client)
        except Exception as e:
            logger.critical("An unexpected critical error occurred in subscriber loop.", exc_info=True)
            await asyncio.sleep(5)

@app.get("/health")
def read_health():
    return {"status": "ok"}
