import os
import redis.asyncio as redis
import asyncio
import json
import time
from fastapi import FastAPI
from planning_model import BasicPlanner
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from sqlalchemy.orm.attributes import flag_modified
from qdrant_client import QdrantClient

# Import the models and Base
from models import Base, Project

app = FastAPI()

# --- Database Setup ---
DATABASE_URL = (
    f"postgresql+asyncpg://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@"
    f"{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
)
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# --- Redis Setup ---
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=redis_host, port=redis_port, db=0)

# --- Qdrant Setup ---
qdrant_client = QdrantClient(host=os.getenv("QDRANT_HOST"), port=os.getenv("QDRANT_PORT"))

# --- Planner ---
planner = BasicPlanner()

def log_to_memory(event: str, data: dict):
    """Formats an event and publishes it to the memory log channel."""
    log_entry = {
        "source": "agent_manager",
        "event": event,
        "data": data,
        "timestamp": time.time()
    }
    # Using a sync publish for simplicity, as this is a non-critical logging path
    sync_redis_client = redis.from_url(f"redis://{redis_host}:{redis_port}")
    sync_redis_client.publish("memory_log_events", json.dumps(log_entry))
    print(f"Logged to memory: {event}")

async def async_redis_subscriber():
    """Listens for messages on Redis channels asynchronously and processes them."""
    pubsub = redis_client.pubsub()
    channels = ["project_tasks", "manager_notifications"]
    await pubsub.subscribe(*channels)
    print(f"Subscribed to channels: {channels}. Listening for messages...")

    while True:
        try:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message is None:
                await asyncio.sleep(0.01)
                continue

            channel = message['channel'].decode('utf-8')
            data = message['data']

            if channel == "project_tasks":
                project_data = json.loads(data)
                project_name = project_data.get('name')

                async with AsyncSessionLocal() as session:
                    # Check if project already exists
                    result = await session.execute(select(Project).where(Project.name == project_name))
                    existing_project = result.scalar_one_or_none()

                    if existing_project:
                        log_to_memory("project_creation_ignored", {"project_name": project_name, "reason": "already_exists"})
                        continue

                    log_to_memory("project_creation_received", {"project_name": project_name, "requirements": project_data.get('requirements')})

                    # Create and save the new project
                    new_project = Project(
                        name=project_name,
                        requirements=project_data.get('requirements', ''),
                        status='pending'
                    )
                    session.add(new_project)
                    await session.commit()
                    await session.refresh(new_project)

                    log_to_memory("project_saved_to_db", {"project_id": new_project.id, "project_name": new_project.name})

                    # Generate and save the execution plan to the database
                    execution_plan = planner.generate_plan(new_project.requirements)
                    log_to_memory("plan_generated", {"project_name": new_project.name, "plan": execution_plan})

                    new_project.state = {
                        "plan": execution_plan,
                        "current_task_index": 0,
                        "artifacts": {}
                    }
                    new_project.status = "in_progress"

                    await session.commit()
                    await session.refresh(new_project)
                    log_to_memory("project_state_initialized_in_db", {"project_id": new_project.id})

                    # Dispatch the first task from the persisted plan
                    if execution_plan:
                        task_to_dispatch = execution_plan[0]
                        task_to_dispatch['project_name'] = new_project.name
                        task_to_dispatch['requirements'] = new_project.requirements
                        agent_name = task_to_dispatch['agent']
                        dispatch_channel_name = f"{agent_name}_tasks"
                        await redis_client.publish(dispatch_channel_name, json.dumps(task_to_dispatch))
                        log_to_memory("task_dispatched", {"project_name": new_project.name, "task": task_to_dispatch})

            elif channel == "manager_notifications":
                notification_data = json.loads(data)
                log_to_memory("task_completion_notification_received", {"notification": notification_data})
                project_name = notification_data.get('project_name')

                async with AsyncSessionLocal() as session:
                    # Fetch the project from the database
                    result = await session.execute(select(Project).where(Project.name == project_name))
                    project = result.scalar_one_or_none()

                    if not project:
                        log_to_memory("project_lookup_failed", {"reason": "Project not found in DB", "project_name": project_name})
                        continue

                    # The state is now a mutable JSON object from the DB
                    state = project.state
                    plan = state.get("plan", [])
                    current_task_index = state.get("current_task_index", 0)

                    if not plan or current_task_index >= len(plan):
                        log_to_memory("invalid_project_state", {"reason": "Plan is empty or task index is out of bounds", "project_name": project.name})
                        continue

                    completed_task_id = notification_data.get('task_id')
                    current_task = plan[current_task_index]

                    if current_task.get('task_id') != completed_task_id:
                        log_to_memory("task_mismatch_error", {"project_name": project.name, "expected_task_id": current_task.get('task_id'), "received_task_id": completed_task_id})
                        continue

                    # Store artifacts from the completed task
                    if "artifacts" in notification_data and notification_data["artifacts"]:
                        if "artifacts" not in state:
                            state["artifacts"] = {}
                        state["artifacts"][str(completed_task_id)] = notification_data["artifacts"]
                        log_to_memory("artifact_stored", {"project_name": project.name, "task_id": completed_task_id})

                    # Increment task index
                    state["current_task_index"] += 1

                    # Check if the project is complete
                    if state["current_task_index"] >= len(plan):
                        project.status = 'completed'
                        log_to_memory("project_completed", {"project_name": project.name})
                    else:
                        # Dispatch the next task
                        project.status = 'in_progress'
                        next_task_to_dispatch = plan[state["current_task_index"]]
                        next_task_to_dispatch['project_name'] = project.name
                        next_task_to_dispatch['requirements'] = project.requirements

                        all_artifacts = [artifact for task_artifacts in state.get("artifacts", {}).values() for artifact in task_artifacts]
                        next_task_to_dispatch['context_artifacts'] = all_artifacts

                        agent_name = next_task_to_dispatch['agent']
                        dispatch_channel_name = f"{agent_name}_tasks"
                        await redis_client.publish(dispatch_channel_name, json.dumps(next_task_to_dispatch))
                        log_to_memory("task_dispatched", {"project_name": project.name, "task": next_task_to_dispatch})

                    # Mark the state as modified and commit changes
                    flag_modified(project, "state")
                    await session.commit()

        except Exception as e:
            print(f"Error in redis_subscriber: {e}")
            await asyncio.sleep(1)


@app.on_event("startup")
async def startup_event():
    """
    On startup, initializes the database and starts the Redis subscriber.
    """
    print("Initializing database...")
    await init_db()
    print("Database initialized.")

    print("Starting Redis subscriber...")
    asyncio.create_task(async_redis_subscriber())
    print("Redis subscriber started in background task.")

@app.get("/health")
def read_health():
    """Check the health of the service."""
    return {"status": "ok"}
