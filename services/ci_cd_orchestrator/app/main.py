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
from .build_manager import BuildManager

# OpenTelemetry and Prometheus instrumentation
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# --- Agent Definition ---
AGENT_NAME = "ci_cd_orchestrator"
WORKSPACE_DIR = "/app/workspace"

# --- Tracer and Logger Setup ---
setup_tracer(AGENT_NAME)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Globals ---
rabbitmq_client: RabbitMQClient
build_manager: BuildManager
heartbeat_thread: threading.Thread
stop_heartbeat = threading.Event()


# --- Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{AGENT_NAME} is starting up.")
    os.makedirs(WORKSPACE_DIR, exist_ok=True)

    global rabbitmq_client, build_manager, heartbeat_thread
    build_manager = BuildManager()

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
    consumer_thread = threading.Thread(target=lambda: rabbitmq_client.consume_messages(f"{AGENT_NAME}_tasks", handle_ci_cd_task))
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
def handle_ci_cd_task(message: dict):
    """
    Handles a CI/CD task, such as 'build'.
    """
    payload = message.get('payload', {})
    action = payload.get('action')
    task_id = payload.get('task_id')
    project_id = payload.get('project_id')
    reply_to_queue = payload.get('reply_to_queue', 'orchestrator_notifications')

    status = "completed"
    artifacts = []

    try:
        if action == 'build':
            repo_path = payload.get('repo_path') # e.g., /app/workspace/MyProject
            language = payload.get('language', 'python')
            output_path = os.path.join(WORKSPACE_DIR, "builds", project_id)
            os.makedirs(output_path, exist_ok=True)

            build_result = build_manager.build_project(repo_path, language, output_path)

            if build_result.get("status") == "success":
                artifacts.append({"type": "build_artifact", "path": build_result.get("artifact_path")})
            else:
                raise Exception(f"Build failed: {build_result.get('error')}")
        else:
            raise NotImplementedError(f"CI/CD action '{action}' is not supported.")

    except Exception as e:
        logger.error(f"Failed to execute CI/CD task {task_id}: {e}", exc_info=True)
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


# --- Agent Self-Registration and Heartbeat ---
def register_with_registry():
    registration_data = {"name": AGENT_NAME, "version": "1.0.0", "capabilities": ["build_python"], "supported_languages": ["python"]}
    message = RabbitMQClient.create_message(source_agent=AGENT_NAME, target_agent="agent_registry", task_type="register", payload=registration_data)
    rabbitmq_client.publish_message("agent_registration", message)
def heartbeat_loop():
    while not stop_heartbeat.is_set():
        time.sleep(60)
        # ... (omitted for brevity)

# --- API Endpoints ---
@app.get("/health")
def read_health():
    return {"status": "ok"}
