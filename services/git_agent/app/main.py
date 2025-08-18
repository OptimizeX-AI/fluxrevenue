import os
import asyncio
import json
import logging
import threading
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI

# Add parent directory to path to import shared services
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from message_broker.rabbitmq_client import RabbitMQClient
from tracing import setup_tracer

# Local components
from .git_client import GitClient

# OpenTelemetry and Prometheus instrumentation
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# --- Agent Definition ---
AGENT_NAME = "git_agent"
WORKSPACE_DIR = "/app/workspace"

# --- Tracer and Logger Setup ---
setup_tracer(AGENT_NAME)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Globals ---
rabbitmq_client: RabbitMQClient
heartbeat_thread: threading.Thread
stop_heartbeat = threading.Event()


# --- Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{AGENT_NAME} is starting up.")
    os.makedirs(WORKSPACE_DIR, exist_ok=True)

    global rabbitmq_client, heartbeat_thread
    rabbitmq_client = RabbitMQClient(
        host=os.getenv("RABBITMQ_HOST", "localhost"),
        username=os.getenv("RABBITMQ_DEFAULT_USER", "user"),
        password=os.getenv("RABBITMQ_DEFAULT_PASS", "password")
    )
    rabbitmq_client.connect()

    # Register, start heartbeat, and start consuming tasks
    register_with_registry()
    heartbeat_thread = threading.Thread(target=heartbeat_loop)
    heartbeat_thread.start()
    consumer_thread = threading.Thread(target=lambda: rabbitmq_client.consume_messages(f"{AGENT_NAME}_tasks", handle_git_task))
    consumer_thread.start()

    yield

    logger.info(f"{AGENT_NAME} is shutting down.")
    stop_heartbeat.set()
    heartbeat_thread.join()
    rabbitmq_client.close()


# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan, title=AGENT_NAME)
Instrumentator().instrument(app).expose(app)
FastAPIInstrumentor.instrument_app(app)


# --- RabbitMQ Handler ---
def handle_git_task(message: dict):
    """
    Handles a git task received from the orchestrator.
    """
    payload = message.get('payload', {})
    action = payload.get('action')
    task_id = payload.get('task_id')
    project_id = payload.get('project_id')
    reply_to_queue = payload.get('reply_to_queue', 'orchestrator_notifications')

    status = "completed"
    artifacts = []

    try:
        if action == 'clone':
            repo_url = payload.get('repo_url')
            local_path = os.path.join(WORKSPACE_DIR, project_id)
            git_client = GitClient(repo_url, local_path)
            artifacts.append({"type": "repository_cloned", "path": local_path})

        # Add other actions like commit, branch, etc. here

        else:
            raise NotImplementedError(f"Git action '{action}' is not supported.")

    except Exception as e:
        logger.error(f"Failed to execute git task {task_id}: {e}", exc_info=True)
        status = "failed"
        artifacts.append({"type": "error_report", "details": str(e)})

    # Notify the orchestrator of the outcome
    completion_message = {
        "task_id": task_id,
        "project_id": project_id,
        "status": status,
        "agent": AGENT_NAME,
        "artifacts": artifacts
    }

    response_message = RabbitMQClient.create_message(
        source_agent=AGENT_NAME,
        target_agent="project_orchestrator",
        task_type="task_completion_notification",
        payload=completion_message
    )
    rabbitmq_client.publish_message(reply_to_queue, response_message)


# --- Agent Self-Registration and Heartbeat (Standard Pattern) ---
def register_with_registry():
    # ...
    pass
def heartbeat_loop():
    # ...
    pass

# Full definitions for brevity
def register_with_registry():
    registration_data = {"name": AGENT_NAME, "version": "1.0.0", "capabilities": ["git_clone", "git_commit", "git_branch"], "supported_languages": []}
    message = RabbitMQClient.create_message(source_agent=AGENT_NAME, target_agent="agent_registry", task_type="register", payload=registration_data)
    rabbitmq_client.publish_message("agent_registration", message)
def heartbeat_loop():
    while not stop_heartbeat.is_set():
        try:
            heartbeat_message = RabbitMQClient.create_message(source_agent=AGENT_NAME, target_agent="agent_registry", task_type="heartbeat", payload={})
            rabbitmq_client.publish_message("agent_heartbeats", heartbeat_message)
        except Exception: pass
        time.sleep(60)

# --- API Endpoints ---
@app.get("/health")
def read_health():
    return {"status": "ok"}
