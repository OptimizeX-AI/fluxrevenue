import os
import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI

# Add parent directory to path to import shared services
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from message_broker.rabbitmq_client import RabbitMQClient
from tracing import setup_tracer

# OpenTelemetry and Prometheus instrumentation
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# --- Agent Definition ---
AGENT_NAME = "agent_manager"

# --- Tracer and Logger Setup ---
setup_tracer(AGENT_NAME)
from services.agent_manager.app.core.config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)

# --- DB and Service Clients ---
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from sqlalchemy.orm.attributes import flag_modified
from services.agent_manager.app.models import Base, Project
from services.agent_manager.app.core.exceptions import (
    ProjectNotFoundError, TaskValidationError
)
from services.agent_manager.app.memory.reporter import report_to_memory
from services.agent_manager.app.decision_engine import DecisionEngine

# --- Global Instances ---
decision_engine: DecisionEngine
rabbitmq_client: RabbitMQClient
AsyncSessionLocal: sessionmaker

# --- Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{AGENT_NAME} is starting up.")

    global decision_engine, rabbitmq_client, AsyncSessionLocal
    decision_engine = DecisionEngine()

    DATABASE_URL = (
        f"postgresql+asyncpg://{os.getenv('POSTGRES_USER', 'jules')}:{os.getenv('POSTGRES_PASSWORD', 'jules')}@"
        f"{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/{os.getenv('POSTGRES_DB', 'jules_db')}"
    )
    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized.")

    rabbitmq_client = RabbitMQClient(
        host=os.getenv("RABBITMQ_HOST", "localhost"),
        username=os.getenv("RABBITMQ_DEFAULT_USER", "user"),
        password=os.getenv("RABBITMQ_DEFAULT_PASS", "password")
    )
    rabbitmq_client.connect()

    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, lambda: rabbitmq_client.consume_messages('project_tasks', handle_project_creation_task))
    loop.run_in_executor(None, lambda: rabbitmq_client.consume_messages('manager_notifications', handle_task_completion_notification))

    yield

    logger.info(f"{AGENT_NAME} is shutting down.")
    rabbitmq_client.close()

# --- FastAPI App Initialization & Metrics ---
app = FastAPI(lifespan=lifespan, title=AGENT_NAME)
FastAPIInstrumentor.instrument_app(app)

# Add custom metrics
instrumentator = Instrumentator().instrument(app)
instrumentator.expose(app)

decisions_made_counter = instrumentator.registry.counter(
    "agent_manager_decisions_made_total",
    "Total number of decisions made by the Decision Engine."
)
task_prioritization_duration = instrumentator.registry.histogram(
    "agent_manager_task_prioritization_duration_seconds",
    "Duration of the task prioritization process."
)

# --- Task Dispatcher ---
def dispatch_task(project_name: str, requirements: str, task: dict, all_artifacts: list):
    # ... (same as before)
    pass

# --- Core Logic ---
async def process_project_state(project: Project):
    state = project.state
    plan = state.get("plan", [])
    completed_ids = set(state.get("completed_task_ids", []))
    dispatched_ids = set(state.get("dispatched_task_ids", []))
    active_ids = completed_ids.union(dispatched_ids)

    runnable_tasks = [
        task for task in plan
        if task.get('task_id') not in active_ids and
           set(task.get('depends_on', [])).issubset(completed_ids)
    ]

    if not runnable_tasks:
        if len(completed_ids) == len(plan):
            project.status = 'completed'
            report_to_memory(rabbitmq_client, project.name, AGENT_NAME, "project_completed", {})
            logger.info(f"Project '{project.name}' completed.")
        return

    # --- Custom Metric Instrumentation ---
    start_time = time.time()
    next_task_to_dispatch = decision_engine.decide_next_action(state, runnable_tasks)
    duration = time.time() - start_time
    task_prioritization_duration.observe(duration)
    # --- End Custom Metric Instrumentation ---

    if next_task_to_dispatch:
        decisions_made_counter.inc() # Increment counter for each decision
        all_artifacts = [artifact for task_artifacts in state.get("artifacts", {}).values() for artifact in task_artifacts]
        dispatched_ids.add(next_task_to_dispatch['task_id'])
        state["dispatched_task_ids"] = sorted(list(dispatched_ids))
        dispatch_task(project.name, project.requirements, next_task_to_dispatch, all_artifacts)

# ... (rest of the file remains the same, including RabbitMQ handlers and health check)
# Full implementation of dispatch_task and handlers would be here.
def dispatch_task(project_name: str, requirements: str, task: dict, all_artifacts: list):
    task_to_dispatch = task.copy()
    task_to_dispatch.update({'project_name': project_name, 'requirements': requirements, 'context_artifacts': all_artifacts})
    dispatch_queue = f"{task['agent']}_tasks"
    message = RabbitMQClient.create_message(source_agent=AGENT_NAME, target_agent=task['agent'], task_type='execute_task', payload=task_to_dispatch)
    rabbitmq_client.publish_message(dispatch_queue, message)
    report_to_memory(rabbitmq_client, project_name, AGENT_NAME, "task_dispatched", {"task": task_to_dispatch})
    logger.info(f"Dispatched task {task['task_id']} to {task['agent']}.")

def handle_project_creation_task(message: dict):
    from services.agent_manager.app.semantic_planner import SemanticPlanner
    planner = SemanticPlanner()
    async def _async_handle():
        project_data = message.get('payload')
        project_name = project_data.get('name')
        if not project_name: raise TaskValidationError("Project name missing.", details=project_data)
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Project).where(Project.name == project_name))
            if result.scalar_one_or_none():
                logger.warning(f"Project '{project_name}' already exists.")
                return
            report_to_memory(rabbitmq_client, project_name, AGENT_NAME, "project_creation_received", {"requirements": project_data.get('requirements', '')})
            new_project = Project(name=project_name, requirements=project_data.get('requirements', ''))
            execution_plan = planner.generate_plan(new_project.requirements)
            report_to_memory(rabbitmq_client, project_name, AGENT_NAME, "plan_generated", {"plan": execution_plan})
            new_project.state = {"plan": execution_plan, "completed_task_ids": [], "dispatched_task_ids": [], "artifacts": {}}
            new_project.status = "in_progress"
            session.add(new_project)
            await session.commit()
            await session.refresh(new_project)
            await process_project_state(new_project)
            flag_modified(new_project, "state")
            await session.commit()
    asyncio.run(_async_handle())

def handle_task_completion_notification(message: dict):
    async def _async_handle():
        notification_data = message.get('payload')
        project_name = notification_data.get('project_name')
        completed_task_id = notification_data.get('task_id')
        source_agent = notification_data.get('agent')
        artifacts = notification_data.get("artifacts", [])
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Project).where(Project.name == project_name))
            project = result.scalar_one_or_none()
            if not project: raise ProjectNotFoundError(project_name)
            state = project.state
            state.setdefault("completed_task_ids", []).append(completed_task_id)
            if artifacts:
                state.setdefault("artifacts", {})[str(completed_task_id)] = artifacts
                report_to_memory(rabbitmq_client, project.name, AGENT_NAME, "artifacts_stored", {"task_id": completed_task_id, "artifacts": artifacts})
            review_artifact = next((a for a in artifacts if a.get("status") == "REJECTED"), None)
            if review_artifact:
                logger.warning(f"Task {completed_task_id} was rejected by {source_agent}.")
                failed_task = next((t for t in state.get("plan", []) if t.get("task_id") == completed_task_id), {})
                error_info = {"source_agent": source_agent, "error_message": review_artifact.get("summary")}
                remediation_task = decision_engine.process_task_failure(failed_task, error_info)
                if remediation_task:
                    max_task_id = max(t["task_id"] for t in state["plan"]) if state["plan"] else 0
                    remediation_task["task_id"] = max_task_id + 1
                    remediation_task["depends_on"] = [completed_task_id]
                    state["plan"].append(remediation_task)
            else:
                completed_task = next((t for t in state.get("plan", []) if t.get("task_id") == completed_task_id), {})
                decision_engine.process_task_success(completed_task, source_agent)
            await process_project_state(project)
            flag_modified(project, "state")
            await session.commit()
    asyncio.run(_async_handle())

@app.get("/health")
def read_health():
    return {"status": "ok"}
