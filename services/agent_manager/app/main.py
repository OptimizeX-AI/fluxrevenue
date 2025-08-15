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

# Local imports with new structure
from services.agent_manager.app.semantic_planner import SemanticPlanner
from services.agent_manager.app.models import Base, Project
from services.agent_manager.app.core.config import setup_logging
from services.agent_manager.app.core.exceptions import (
    BaseAgentException,
    ProjectNotFoundError,
    TaskValidationError,
    InfrastructureError,
)

# Setup structured logging for the entire application
setup_logging()
logger = logging.getLogger(__name__)

# --- Redis & Qdrant Setup ---
redis_client = redis.Redis(host=os.getenv("REDIS_HOST", "localhost"), port=int(os.getenv("REDIS_PORT", 6379)), db=0)
qdrant_client = QdrantClient(host=os.getenv("QDRANT_HOST"), port=os.getenv("QDRANT_PORT"))
planner = SemanticPlanner()

# --- Database Setup ---
# Provide default values for local testing; these are overridden by Docker environment variables.
DATABASE_URL = (
    f"postgresql+asyncpg://{os.getenv('POSTGRES_USER', 'jules')}:{os.getenv('POSTGRES_PASSWORD', 'jules')}@"
    f"{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/{os.getenv('POSTGRES_DB', 'jules_db')}"
)
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    """Initializes the database and creates tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# --- Lifespan Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager for the FastAPI application."""
    logger.info("Agent Manager is starting up.")
    await init_db()
    logger.info("Database initialized.")

    subscriber_task = asyncio.create_task(async_redis_subscriber())

    yield

    logger.info("Agent Manager is shutting down.")
    subscriber_task.cancel()
    try:
        await subscriber_task
    except asyncio.CancelledError:
        logger.info("Redis subscriber task cancelled successfully.")

# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan)


# --- Task Handlers ---
async def handle_project_creation_task(project_data: dict):
    """Handles the logic for creating a new project."""
    project_name = project_data.get('name')
    if not project_name:
        raise TaskValidationError("Project name is missing from project creation data.", details=project_data)

    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(select(Project).where(Project.name == project_name))
            if result.scalar_one_or_none():
                logger.warning("Project creation ignored, project already exists.", extra={"props": {"project_name": project_name}})
                return

            logger.info("Creating new project.", extra={"props": {"project_name": project_name}})

            new_project = Project(name=project_name, requirements=project_data.get('requirements', ''))
            session.add(new_project)
            await session.commit()
            await session.refresh(new_project)

            logger.info("Project saved to database.", extra={"props": {"project_id": new_project.id}})

            execution_plan = planner.generate_plan(new_project.requirements)
            new_project.state = {
                "plan": execution_plan,
                "completed_task_ids": [],
                "dispatched_task_ids": [],
                "artifacts": {}
            }
            new_project.status = "in_progress"

            await session.commit()
            logger.info("Project state initialized in DB.", extra={"props": {"project_id": new_project.id}})

            # Dispatch all initial tasks that have no dependencies
            if execution_plan:
                initial_tasks = [task for task in execution_plan if not task.get('depends_on')]
                logger.info(f"Dispatching {len(initial_tasks)} initial tasks.", extra={"props": {"project_id": new_project.id}})
                for task in initial_tasks:
                    task_to_dispatch = task.copy()
                    task_to_dispatch['project_name'] = new_project.name
                    task_to_dispatch['requirements'] = new_project.requirements
                    agent_name = task_to_dispatch['agent']
                    dispatch_channel = f"{agent_name}_tasks"
                    await redis_client.publish(dispatch_channel, json.dumps(task_to_dispatch))
                    logger.info("Dispatched initial task.", extra={"props": {"project_id": new_project.id, "task_id": task_to_dispatch.get('task_id'), "agent": agent_name}})
        except SQLAlchemyError as e:
            raise InfrastructureError("database", e)

async def handle_task_completion_notification(notification_data: dict):
    """
    Handles a task completion notification, resolves dependencies, and dispatches new tasks.
    """
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

            state = project.state
            plan = state.get("plan", [])
            completed_ids = set(state.get("completed_task_ids", []))
            dispatched_ids = set(state.get("dispatched_task_ids", []))

            # Add the newly completed task
            if completed_task_id not in completed_ids:
                completed_ids.add(completed_task_id)
                state["completed_task_ids"] = sorted(list(completed_ids))

            # Store artifacts
            if "artifacts" in notification_data and notification_data["artifacts"]:
                state.setdefault("artifacts", {})[str(completed_task_id)] = notification_data["artifacts"]
                logger.info("Stored artifacts for task.", extra={"props": {"project_id": project.id, "task_id": completed_task_id}})

            # Find tasks that are not yet completed or dispatched
            active_ids = completed_ids.union(dispatched_ids)
            runnable_tasks = [task for task in plan if task.get('task_id') not in active_ids]

            # Check for new tasks to dispatch
            newly_dispatchable_tasks = []
            for task in runnable_tasks:
                if set(task.get('depends_on', [])).issubset(completed_ids):
                    newly_dispatchable_tasks.append(task)

            if newly_dispatchable_tasks:
                logger.info(f"Dispatching {len(newly_dispatchable_tasks)} newly unlocked tasks.", extra={"props": {"project_id": project.id}})
                all_artifacts = [artifact for task_artifacts in state.get("artifacts", {}).values() for artifact in task_artifacts]

                for task in newly_dispatchable_tasks:
                    dispatched_ids.add(task.get('task_id'))
                    task_to_dispatch = task.copy()
                    task_to_dispatch.update({
                        'project_name': project.name,
                        'requirements': project.requirements,
                        'context_artifacts': all_artifacts
                    })
                    agent_name = task_to_dispatch['agent']
                    dispatch_channel = f"{agent_name}_tasks"
                    await redis_client.publish(dispatch_channel, json.dumps(task_to_dispatch))
                    logger.info("Dispatched next task.", extra={"props": {"project_id": project.id, "task_id": task_to_dispatch.get('task_id'), "agent": agent_name}})

            # Update dispatched tasks list in state
            state["dispatched_task_ids"] = sorted(list(dispatched_ids))

            # Check for project completion
            if len(completed_ids) == len(plan):
                project.status = 'completed'
                logger.info("Project completed successfully: all tasks are done.", extra={"props": {"project_id": project.id}})
            else:
                project.status = 'in_progress'
                if not newly_dispatchable_tasks:
                    logger.info("Task completed, but no new tasks are ready to be dispatched yet.", extra={"props": {"project_id": project.id}})

            flag_modified(project, "state")
            await session.commit()

        except SQLAlchemyError as e:
            raise InfrastructureError("database", e)

# --- Main Subscriber Loop ---
async def async_redis_subscriber():
    """Main Redis subscriber loop."""
    logger.info("Starting Redis subscriber...")
    pubsub = redis_client.pubsub()
    channels = ["project_tasks", "manager_notifications"]
    await pubsub.subscribe(*channels)
    logger.info("Subscribed to Redis channels.", extra={"props": {"channels": channels}})

    while True:
        try:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if not message:
                await asyncio.sleep(0.01)
                continue

            channel = message['channel'].decode('utf-8')
            data = json.loads(message['data'])

            logger.debug("Received message from Redis.", extra={"props": {"channel": channel}})

            if channel == "project_tasks":
                await handle_project_creation_task(data)
            elif channel == "manager_notifications":
                await handle_task_completion_notification(data)

        except json.JSONDecodeError:
            logger.error("Failed to decode JSON from Redis message.", extra={"props": {"raw_message": message.get('data', '')}})
        except BaseAgentException as e:
             logger.warning(f"A handled business logic error occurred: {e.message}", extra={"props": {"exception_type": type(e).__name__}})
        except Exception:
            logger.critical("An unexpected critical error occurred in subscriber loop.", exc_info=True)
            await asyncio.sleep(5)

# --- API Endpoints ---
@app.get("/health")
def read_health():
    """Health check endpoint."""
    return {"status": "ok"}
