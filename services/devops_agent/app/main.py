import os
import asyncio
import json
import logging
import threading
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI

from services.devops_agent.app.core.config import setup_logging
from services.devops_agent.app.core.exceptions import BaseAgentException
from services.devops_agent.app.task_processor import process_devops_task

# Add shared services to path
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from message_broker.rabbitmq_client import RabbitMQClient

# Setup structured logging
setup_logging()
logger = logging.getLogger(__name__)

# --- Agent Definition ---
AGENT_NAME = "devops_agent"
AGENT_VERSION = "1.0.0"
AGENT_CAPABILITIES = ["dockerfile_generation", "kubernetes_deployment", "ci_cd_pipeline_setup"]
AGENT_SUPPORTED_LANGUAGES = []
HEARTBEAT_INTERVAL = 60

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
    try:
        task_data = message.get('payload')
        logger.info("Received new DevOps task.", extra={"props": {"task_id": task_data.get("task_id")}})

        asyncio.run(process_devops_task(task_data, None)) # Passing None for redis_client
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

    # Register agent and start heartbeating
    register_with_registry()
    heartbeat_thread = threading.Thread(target=heartbeat_loop)
    heartbeat_thread.start()

    # Start listening for tasks
    consumer_thread = threading.Thread(target=lambda: rabbitmq_client.consume_messages(f"{AGENT_NAME}_tasks", task_consumer_callback))
    consumer_thread.start()

    yield

    logger.info(f"{AGENT_NAME} is shutting down.")
    stop_heartbeat.set()
    heartbeat_thread.join()
    rabbitmq_client.close()


app = FastAPI(lifespan=lifespan)

@app.get("/health")
def read_health():
    """Health check endpoint for the DevOps Agent."""
    return {"status": "ok"}
