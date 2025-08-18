import os
import asyncio
import json
import logging
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response

# Add parent directory to path to import shared services
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from message_broker.rabbitmq_client import RabbitMQClient
from tracing import setup_tracer

# Local components
from .workflow_engine import WorkflowEngine
from .progress_tracker import ProgressTracker
from .resource_allocator import ResourceAllocator

# OpenTelemetry and Prometheus instrumentation
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# --- Agent Definition ---
AGENT_NAME = "project_orchestrator"

# --- Tracer and Logger Setup ---
setup_tracer(AGENT_NAME)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Globals ---
rabbitmq_client: RabbitMQClient
workflow_engine: WorkflowEngine
progress_tracker: ProgressTracker
resource_allocator: ResourceAllocator


# --- Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{AGENT_NAME} is starting up.")

    global rabbitmq_client, workflow_engine, progress_tracker, resource_allocator
    workflow_engine = WorkflowEngine()
    progress_tracker = ProgressTracker()
    resource_allocator = ResourceAllocator()

    rabbitmq_client = RabbitMQClient(
        host=os.getenv("RABBITMQ_HOST", "localhost"),
        username=os.getenv("RABBITMQ_DEFAULT_USER", "user"),
        password=os.getenv("RABBITMQ_DEFAULT_PASS", "password")
    )
    rabbitmq_client.connect()

    # Set up consumers for different events
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, lambda: rabbitmq_client.consume_messages('project_orchestration_tasks', handle_new_project_task))
    # The orchestrator now needs to listen to completion notifications to advance the workflow
    loop.run_in_executor(None, lambda: rabbitmq_client.consume_messages('orchestrator_notifications', handle_task_completion))

    yield

    logger.info(f"{AGENT_NAME} is shutting down.")
    rabbitmq_client.close()


# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan, title=AGENT_NAME)
Instrumentator().instrument(app).expose(app)
FastAPIInstrumentor.instrument_app(app)


# --- RabbitMQ Handlers ---
def handle_new_project_task(message: dict):
    """Handles a new project request, creates a workflow, and kicks it off."""
    try:
        project_spec = message.get('payload')
        project_id = project_spec.get('name')
        logger.info(f"Received new project to orchestrate: {project_id}")

        workflow = workflow_engine.create_workflow(project_spec)
        progress_tracker.start_tracking(project_id, workflow)

        # Instead of just dispatching the first, we now process the initial state
        process_workflow_step(project_id, workflow)

    except Exception as e:
        logger.error(f"Failed to process new project for orchestration: {e}", exc_info=True)

def handle_task_completion(message: dict):
    """Handles notifications from agents about task completion to advance the workflow."""
    try:
        payload = message.get('payload')
        project_id = payload.get('project_id')
        task_id = payload.get('task_id')

        logger.info(f"Received task completion for project '{project_id}', task '{task_id}'.")
        progress_tracker.mark_task_completed(project_id, task_id)

        # We need the full workflow object to continue
        # In a real system, this would be retrieved from a database.
        # For now, we assume it's in memory in the progress tracker.
        workflow = progress_tracker.projects.get(project_id)
        if workflow:
             process_workflow_step(project_id, workflow)

    except Exception as e:
        logger.error(f"Failed to handle task completion notification: {e}", exc_info=True)

def process_workflow_step(project_id: str, workflow: dict):
    """
    Analyzes the current workflow state and dispatches the next set of runnable tasks.
    """
    plan = workflow.get("execution_plan", [])
    tasks_status = progress_tracker.projects[project_id]["tasks"]

    completed_ids = {tid for tid, s in tasks_status.items() if s["status"] == "completed"}
    inprogress_ids = {tid for tid, s in tasks_status.items() if s["status"] == "in_progress"}

    runnable_tasks = [
        task for task in plan
        if task['task_id'] not in completed_ids and
           task['task_id'] not in inprogress_ids and
           set(task.get('depends_on', [])).issubset(completed_ids)
    ]

    logger.info(f"Found {len(runnable_tasks)} runnable tasks for project '{project_id}'.")
    for task in runnable_tasks:
        agent_name = task.get("agent")
        if agent_name:
            progress_tracker.mark_task_started(project_id, task['task_id'])
            task_message = RabbitMQClient.create_message(
                source_agent=AGENT_NAME,
                target_agent=agent_name,
                task_type='execute_task',
                payload=task
            )
            # Agents now need to notify the orchestrator, not the manager
            task_message['payload']['reply_to_queue'] = 'orchestrator_notifications'
            rabbitmq_client.publish_message(f"{agent_name}_tasks", task_message)


# --- API Endpoints ---
@app.get("/health")
def read_health():
    return {"status": "ok"}

@app.get("/api/v1/projects/{project_id}/report", response_class=Response(media_type="text/markdown"))
def get_project_report(project_id: str):
    """Generates and returns a Markdown progress report for a project."""
    report = progress_tracker.generate_report(project_id)
    return Response(content=report, media_type="text/markdown")
