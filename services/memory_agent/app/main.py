import os
import asyncio
import json
import logging
import threading
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI

from services.memory_agent.app.core.config import setup_logging
from services.memory_agent.app.core.exceptions import BaseAgentException
from services.memory_agent.app.models import Base
from services.memory_agent.app.memory_processor import process_event

# Add shared services to path
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from message_broker.rabbitmq_client import RabbitMQClient

# Database Setup
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Setup structured logging
setup_logging()
logger = logging.getLogger(__name__)

# --- Agent Definition ---
AGENT_NAME = "memory_agent"
AGENT_VERSION = "1.0.0"
AGENT_CAPABILITIES = ["event_storage", "knowledge_graph_updates", "semantic_search"]
AGENT_SUPPORTED_LANGUAGES = []
HEARTBEAT_INTERVAL = 60

# --- Globals ---
rabbitmq_client: RabbitMQClient
heartbeat_thread: threading.Thread
stop_heartbeat = threading.Event()
AsyncSessionLocal: sessionmaker

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

def event_consumer_callback(message: dict):
    """Callback to process events received from RabbitMQ."""
    try:
        event_data = message.get('payload')
        logger.info("Received new event for memory.", extra={"props": {"event_type": event_data.get("event_type")}})

        async def do_process():
             async with AsyncSessionLocal() as session:
                await process_event(event_data, session)

        asyncio.run(do_process())
    except Exception:
        logger.critical("An unexpected critical error occurred in event callback.", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager to handle startup and shutdown events."""
    logger.info(f"{AGENT_NAME} is starting up.")

    # Initialize DB
    global AsyncSessionLocal
    DATABASE_URL = (
        f"postgresql+asyncpg://{os.getenv('POSTGRES_USER', 'jules')}:{os.getenv('POSTGRES_PASSWORD', 'jules')}@"
        f"{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/{os.getenv('POSTGRES_DB', 'jules_db')}_memory"
    )
    engine = create_async_engine(DATABASE_URL, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Memory database initialized.")

    # Initialize RabbitMQ
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

    # Start listening for events
    consumer_thread = threading.Thread(target=lambda: rabbitmq_client.consume_messages("memory_events", event_consumer_callback))
    consumer_thread.start()

    yield

    logger.info(f"{AGENT_NAME} is shutting down.")
    stop_heartbeat.set()
    heartbeat_thread.join()
    rabbitmq_client.close()


app = FastAPI(lifespan=lifespan)

@app.get("/health")
def read_health():
    """Health check endpoint for the Memory Agent."""
    return {"status": "ok"}
