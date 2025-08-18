import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from typing import List

# Add parent directory to path to import shared services
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from message_broker.rabbitmq_client import RabbitMQClient
from tracing import setup_tracer

# Local components
from .models import AgentMetadata, AgentRegistration
from .registry import AgentRegistry
from .health_checker import HealthChecker

# OpenTelemetry and Prometheus instrumentation
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# --- Agent Definition ---
AGENT_NAME = "agent_registry"

# --- Tracer and Logger Setup ---
setup_tracer(AGENT_NAME)
# In a real app, a shared config module would be better
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Globals ---
agent_registry: AgentRegistry
rabbitmq_client: RabbitMQClient
health_checker: HealthChecker


# --- Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{AGENT_NAME} is starting up.")

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

    logger.info("Background tasks started for Agent Registry.")

    yield

    logger.info(f"{AGENT_NAME} is shutting down.")
    await health_checker.stop()
    rabbitmq_client.close()


# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan, title=AGENT_NAME)
Instrumentator().instrument(app).expose(app)
FastAPIInstrumentor.instrument_app(app)


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
        payload = message.get('payload', {})
        if agent_name:
            agent_registry.update_heartbeat(agent_name, payload)
            # logger.debug(f"Heartbeat received from: {agent_name}") # This can be too noisy
    except Exception as e:
        logger.error(f"Failed to process heartbeat message: {e}", exc_info=True)


# --- API Endpoints ---
@app.get("/health")
def read_health():
    return {"status": "ok"}

@app.get("/agents", response_model=List[AgentMetadata])
def list_agents():
    return agent_registry.list_agents()

@app.get("/agents/{agent_name}", response_model=AgentMetadata)
def get_agent(agent_name: str):
    agent = agent_registry.get_agent(agent_name)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent
