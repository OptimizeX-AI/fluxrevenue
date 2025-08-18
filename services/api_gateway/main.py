import os
import redis
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Any

# Add parent directory to path to import shared services
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from tracing import setup_tracer
from common.secure_input import SecureBaseModel # Import the new secure model

# Opentelemetry instrumentation
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

# --- Tracer Setup ---
setup_tracer("api_gateway")

# --- Configuration ---
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
AGENT_REGISTRY_URL = os.getenv("AGENT_REGISTRY_URL", "http://agent_registry:8010")
MEMORY_AGENT_URL = os.getenv("MEMORY_AGENT_URL", "http://memory_agent:8009")


# --- Pydantic Models ---
# Inherit from SecureBaseModel to get automatic sanitization
class Project(SecureBaseModel):
    name: str
    requirements: str

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


# --- FastAPI App Initialization ---
app = FastAPI()

# Instrument for Prometheus
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)

# Instrument for OpenTelemetry
FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor().instrument()


# --- Service Clients ---
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
http_client = httpx.AsyncClient()


# --- API Endpoints ---
@app.get("/health")
def read_health():
    return {"status": "ok"}

@app.post("/api/v1/projects")
def create_project(project: Project):
    # This should be updated to use RabbitMQ
    message = project.model_dump_json()
    redis_client.publish("project_tasks", message)
    return {"message": "Project received and queued for processing.", "project_name": project.name}


# --- Agent Registry Endpoints ---
@app.get("/api/v1/agents/list", response_model=List[Agent])
async def list_registered_agents():
    try:
        response = await http_client.get(f"{AGENT_REGISTRY_URL}/agents")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Agent Registry is unavailable.")

@app.get("/api/v1/agents/{agent_name}", response_model=Any)
async def get_agent_details(agent_name: str):
    try:
        response = await http_client.get(f"{AGENT_REGISTRY_URL}/agents/{agent_name}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Agent Registry is unavailable.")


# --- Memory Agent Endpoints ---
@app.post("/api/v1/memory/query/semantic", response_model=List)
async def query_semantic_memory(query: MemoryQuery):
    """Proxies a semantic search query to the Memory Agent."""
    try:
        response = await http_client.post(f"{MEMORY_AGENT_URL}/api/v1/memory/query/semantic", json=query.model_dump())
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Memory Agent is unavailable.")

@app.post("/api/v1/memory/query/kg", response_model=List)
async def query_knowledge_graph(query: KnowledgeQuery):
    """Proxies a knowledge graph query to the Memory Agent."""
    try:
        response = await http_client.post(f"{MEMORY_AGENT_URL}/api/v1/memory/query/kg", json=query.model_dump())
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Memory Agent is unavailable.")
