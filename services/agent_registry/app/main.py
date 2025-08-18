import os
import asyncio
import logging
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), .., ..)))
from tracing import setup_tracer
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from prometheus_fastapi_instrumentator import Instrumentator
from typing import List

from .models import AgentMetadata, AgentRegistration
from .registry import AgentRegistry
from .health_checker import HealthChecker

# Assuming the message broker is in a shared services location
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from message_broker.rabbitmq_client import RabbitMQClient

# Basic logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Globals ---
agent_registry: AgentRegistry
rabbitmq_client: RabbitMQClient
health_checker: HealthChecker

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Agent Registry is starting up.")

    # Initialize services
    global agent_registry, rabbitmq_client, health_checker
    agent_registry = AgentRegistry(
        redis_host=os.getenv("REDIS_HOST", "localhost"),
        redis_port=int(os.getenv("REDIS_PORT", 6379))
    )
    rabbitmq_client = RabbitMQClient(
        host=os.getenv("RABBITMQ_HOST", "localhost"),
        username=os.getenv("RABBITMQ_DEFAULT_USER", "user"),
        password=os.getenv("RABBITMQ_DEFAULT_PASS", "password")
    )
    health_checker = HealthChecker(agent_registry)

    rabbitmq_client.connect()

    # Start background tasks
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, lambda: rabbitmq_client.consume_messages('agent_registration', handle_registration))
    loop.run_in_executor(None, lambda: rabbitmq_client.consume_messages('agent_heartbeats', handle_heartbeat))
    await health_checker.start()

    logger.info("Background tasks started.")

    yield

    logger.info("Agent Registry is shutting down.")
    rabbitmq_client.close()
    await health_checker.stop()


app = FastAPI(lifespan=lifespan, title="Agent Registry", version="1.0.0")

# --- RabbitMQ Callbacks ---

def handle_registration(message: dict):
    try:
        payload = message.get('payload')
        registration_data = AgentRegistration(**payload)
        agent_registry.register_agent(registration_data)
        logger.info(f"Agent registered: {registration_data.name}")
    except Exception as e:
        logger.error(f"Failed to process registration message: {e}", exc_info=True)

def handle_heartbeat(message: dict):
    try:
        agent_name = message.get('source_agent')
        if agent_name:
            agent_registry.update_heartbeat(agent_name)
            logger.debug(f"Heartbeat received from: {agent_name}")
    except Exception as e:
        logger.error(f"Failed to process heartbeat message: {e}", exc_info=True)


# --- API Endpoints ---

@app.get("/health")
def read_health():
    """Health check endpoint."""
    return {"status": "ok"}

@app.get("/agents", response_model=List[AgentMetadata])
def list_agents():
    """Lists all registered agents."""
    return agent_registry.list_agents()

@app.get("/agents/{agent_name}", response_model=AgentMetadata)
def get_agent(agent_name: str):
    """Retrieves the metadata for a specific agent."""
    agent = agent_registry.get_agent(agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
