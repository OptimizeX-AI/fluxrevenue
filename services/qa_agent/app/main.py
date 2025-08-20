import os
import asyncio
import json
import logging
import threading
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI

from services.message_broker.rabbitmq_client import RabbitMQClient
from services.tracing import setup_tracer

# OpenTelemetry and Prometheus instrumentation
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# --- Agent Definition ---
AGENT_NAME = "qa_agent"
AGENT_VERSION = "1.0.0"
AGENT_CAPABILITIES = ["test_plan_generation", "test_case_writing", "integration_testing"]
AGENT_SUPPORTED_LANGUAGES = []
HEARTBEAT_INTERVAL = 60

# --- Tracer and Logger Setup ---
setup_tracer(AGENT_NAME)
from .core.config import setup_logging
setup_logging()
logger = logging.getLogger(__name__)


# --- Globals ---
rabbitmq_client: RabbitMQClient
heartbeat_thread: threading.Thread
stop_heartbeat = threading.Event()
main_loop: asyncio.AbstractEventLoop


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
    """Periodically sends heartbeat messages."""
    while not stop_heartbeat.is_set():
        try:
            heartbeat_message = RabbitMQClient.create_message(
                source_agent=AGENT_NAME,
                target_agent="agent_registry",
                task_type="heartbeat",
                payload={}
            )
            rabbitmq_client.publish_message("agent_heartbeats", heartbeat_message)
            logger.debug(f"Sent heartbeat from {AGENT_NAME}.")
        except Exception as e:
            logger.error(f"Failed to send heartbeat: {e}", exc_info=True)

        time.sleep(HEARTBEAT_INTERVAL)

def task_consumer_callback(message: dict):
    """Callback to process tasks received from RabbitMQ."""
    from services.qa_agent.app.task_processor import process_qa_task
    from services.qa_agent.app.core.exceptions import BaseAgentException
    try:
        task_data = message.get('payload')
        logger.info("Received new QA task.", extra={"props": {"task_id": task_data.get("task_id")}})

        # The task processor itself is synchronous, but we call it from the loop
        # to maintain a consistent pattern. If it becomes async, this will work.
        # Note: The original call was asyncio.run(process_qa_task(...)), which is a bug.
        # Since process_qa_task is not an async function, we can call it directly.
        # However, to prepare for it becoming async, we can wrap it.
        async def async_wrapper():
            process_qa_task(task_data, rabbitmq_client) # Pass the real client

        asyncio.run_coroutine_threadsafe(async_wrapper(), main_loop)
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

    global rabbitmq_client, heartbeat_thread, main_loop
    main_loop = asyncio.get_running_loop()
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
    """Health check endpoint for the QA Agent."""
    return {"status": "ok"}
