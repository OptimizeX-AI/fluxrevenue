import os
import redis
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Any

# --- Configuration ---
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
AGENT_REGISTRY_URL = os.getenv("AGENT_REGISTRY_URL", "http://agent_registry:8010")

# --- Pydantic Models ---
class Project(BaseModel):
    name: str
    requirements: str

class Agent(BaseModel):
    # A simplified model for the gateway, the registry holds the full model
    name: str
    version: str
    status: str

# --- FastAPI App Initialization ---
app = FastAPI()
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
http_client = httpx.AsyncClient()


# --- API Endpoints ---

@app.get("/health")
def read_health():
    """Check the health of the service."""
    return {"status": "ok"}

@app.post("/api/v1/projects")
def create_project(project: Project):
    """
    Receives project requirements and publishes them to a Redis channel.
    NOTE: This will be migrated to RabbitMQ in a future step.
    """
    message = project.model_dump_json()
    redis_client.publish("project_tasks", message)
    return {"message": "Project received and queued for processing.", "project_name": project.name}


# --- Agent Registry Endpoints ---

@app.get("/api/v1/agents/list", response_model=List[Agent])
async def list_registered_agents():
    """
    Lists all agents registered with the Agent Registry.
    """
    try:
        response = await http_client.get(f"{AGENT_REGISTRY_URL}/agents")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Agent Registry is unavailable.")

@app.get("/api/v1/agents/{agent_name}", response_model=Any) # Any, as the model is complex
async def get_agent_details(agent_name: str):
    """
    Gets detailed information for a specific agent from the Agent Registry.
    """
    try:
        response = await http_client.get(f"{AGENT_REGISTRY_URL}/agents/{agent_name}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Agent Registry is unavailable.")
