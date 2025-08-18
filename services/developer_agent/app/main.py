import os
import asyncio
import json
import logging
import threading
import time
import random
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
AGENT_NAME = "developer_agent"
AGENT_VERSION = "1.0.0"
AGENT_CAPABILITIES = ["code_generation", "python", "javascript", "remediation"]
AGENT_SUPPORTED_LANGUAGES = ["python", "javascript", "typescript", "html", "css"]
HEARTBEAT_INTERVAL = 30 # Reduced for faster demo of health checking

# --- Tracer and Logger Setup ---
setup_tracer(AGENT_NAME)
from services.developer_agent.app.core.config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)


# --- Globals ---
rabbitmq_client: RabbitMQClient
heartbeat_thread: threading.Thread
stop_heartbeat = threading.Event()


def register_with_registry():
    """Sends a registration message to the agent registry."""
    registration_data = {
        "name": AGENT_NAME,
        "version": AGENT_VERSION,
        "capabilities": AGENT_CAPABILITIES,
        "supported_languages": AGENT_SUPPORTED_LANGUAGES,
    }
    message = RabbitMQClient.create_message(
        source_agent=AGENT_NAME,
        target_agent="agent_registry",
        task_type="register",
        payload=registration_data
    )
    rabbitmq_client.publish_message("agent_registration", message)
    logger.info(f"Sent registration request for {AGENT_NAME}.")

def heartbeat_loop():
    """Periodically sends heartbeat messages with simulated performance metrics."""
    while not stop_heartbeat.is_set():
        try:
            # Simulate performance metrics
            performance_metrics = {
                "cpu_load": round(random.uniform(0.1, 0.9), 2), # Simulate CPU load
                "memory_usage": round(random.uniform(0.2, 0.8), 2) # Simulate memory usage %
            }

            heartbeat_message = RabbitMQClient.create_message(
                source_agent=AGENT_NAME,
                target_agent="agent_registry",
                task_type="heartbeat",
                payload={"performance_metrics": performance_metrics}
            )
            rabbitmq_client.publish_message("agent_heartbeats", heartbeat_message)
            logger.debug(f"Sent heartbeat from {AGENT_NAME} with metrics: {performance_metrics}")
        except Exception as e:
            logger.error(f"Failed to send heartbeat: {e}", exc_info=True)

        time.sleep(HEARTBEAT_INTERVAL)

def task_consumer_callback(message: dict):
    """Callback to process tasks received from RabbitMQ."""
    from services.developer_agent.app.task_processor import process_development_task
    from services.developer_agent.app.core.exceptions import BaseAgentException
    try:
        task_data = message.get('payload')
        logger.info("Received new development task.", extra={"props": {"task_id": task_data.get("task_id")}})

        asyncio.run(process_development_task(task_data, rabbitmq_client)) # Pass client
    except json.JSONDecodeError:
        logger.error("Failed to decode JSON from RabbitMQ message.", extra={"props": {"raw_message": message}})
    except BaseAgentException as e:
         logger.warning(f"A handled business logic error occurred: {e.message}", extra={"props": {"exception_type": type(e).__name__}})
    except Exception:
        logger.critical("An unexpected critical error occurred in task callback.", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager to handle startup and shutdown events."""
    logger.info(f"{AGENT_NAME} is starting up.")

    global rabbitmq_client, heartbeat_thread
    rabbitmq_client = RabbitMQClient(
        host=os.getenv("RABBITMQ_HOST", "localhost"),
        username=os.getenv("RABBITMQ_DEFAULT_USER", "user"),
        password=os.getenv("RABBITMQ_DEFAULT_PASS", "password")
    )
    rabbitmq_client.connect()

    register_with_registry()
    heartbeat_thread = threading.Thread(target=heartbeat_loop)
    heartbeat_thread.start()

    consumer_thread = threading.Thread(target=lambda: rabbitmq_client.consume_messages(f"{AGENT_NAME}_tasks", task_consumer_callback))
    consumer_thread.start()

    yield

    logger.info(f"{AGENT_NAME} is shutting down.")
    stop_heartbeat.set()
    heartbeat_thread.join()
    rabbitmq_client.close()


# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan)
Instrumentator().instrument(app).expose(app)
FastAPIInstrumentor.instrument_app(app)


@app.get("/health")
def read_health():
    """Health check endpoint for the Developer Agent."""
    return {"status": "ok"}
