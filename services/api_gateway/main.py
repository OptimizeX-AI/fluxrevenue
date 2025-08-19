import os
import httpx
from fastapi import FastAPI, HTTPException, Response
from typing import List, Any, Dict
from contextlib import asynccontextmanager

# Use absolute imports now that 'services' is a package
from services.tracing import setup_tracer
from services.common.secure_input import SecureBaseModel
from services.message_broker.rabbitmq_client import RabbitMQClient

# Opentelemetry instrumentation
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

# --- Tracer Setup ---
setup_tracer("api_gateway")

# --- Configuration ---
AGENT_REGISTRY_URL = os.getenv("AGENT_REGISTRY_URL", "http://agent_registry:8010")
MEMORY_AGENT_URL = os.getenv("MEMORY_AGENT_URL", "http://memory_agent:8009")
PROJECT_ORCHESTRATOR_URL = os.getenv("PROJECT_ORCHESTRATOR_URL", "http://project_orchestrator:8011")


# --- Pydantic Models ---
class Project(SecureBaseModel):
    name: str
    requirements: str
    tasks: List[Dict[str, Any]] = []

class Agent(SecureBaseModel):
    name: str
    version: str
    status: str

class MemoryQuery(SecureBaseModel):
    query: str
    k: int = 5

class KnowledgeQuery(SecureBaseModel):
    entity_id: str
    relationship_type: str = None


# --- Service Clients ---
http_client = httpx.AsyncClient()
rabbitmq_client = RabbitMQClient(
    host=os.getenv("RABBITMQ_HOST", "localhost"),
    username=os.getenv("RABBITMQ_DEFAULT_USER", "user"),
    password=os.getenv("RABBITMQ_DEFAULT_PASS", "password")
)

# --- App Lifecycle Events ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events for the application."""
    # Startup: Connect to RabbitMQ
    print("Connecting to RabbitMQ...")
    rabbitmq_client.connect()
    yield
    # Shutdown: Close connections
    print("Closing connections...")
    await http_client.aclose()
    rabbitmq_client.close()

# --- FastAPI App Initialization ---
app = FastAPI(lifespan=lifespan)

# Instrument for Prometheus and OpenTelemetry
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)
FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor().instrument()




# --- API Endpoints ---
@app.get("/health")
def read_health():
    return {"status": "ok"}

@app.post("/api/v1/projects")
def create_project(project: Project):
    message_payload = project.model_dump()
    message = RabbitMQClient.create_message(
        source_agent="api_gateway",
        target_agent="project_orchestrator",
        task_type="orchestrate_project",
        payload=message_payload
    )
    rabbitmq_client.publish_message("project_orchestration_tasks", message)
    return {"message": "Project received and sent to orchestrator for processing.", "project_name": project.name}

@app.get("/api/v1/projects/{project_id}/report", response_class=Response)
async def get_project_progress_report(project_id: str):
    """Proxies a request for a project progress report to the Project Orchestrator."""
    try:
        response = await http_client.get(f"{PROJECT_ORCHESTRATOR_URL}/api/v1/projects/{project_id}/report")
        response.raise_for_status()
        # Return the raw content with the correct media type
        return Response(content=response.text, media_type="text/markdown")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Project Orchestrator is unavailable.")

# ... (Other endpoints remain the same)
@app.get("/api/v1/agents/list", response_model=List[Agent])
async def list_registered_agents():
    # TODO: Implement this endpoint to proxy the request to the agent_registry service.
    pass
# ... (and so on)
