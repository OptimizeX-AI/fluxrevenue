from fastapi import FastAPI, HTTPException, Body
import asyncio
from .models import AgentNetwork
from .emergence_engine import EmergenceEngine

app = FastAPI(
    title="Emergence and Self-Organization Engine",
    description="Service for observing emergent behaviors and enabling network self-organization.",
    version="1.0.0"
)

emergence_engine = EmergenceEngine()

@app.post("/enable-emergence", status_code=202)
async def enable_emergence(agent_network: AgentNetwork):
    """
    Starts the long-running process of monitoring the agent network for
    emergent behaviors. This endpoint returns immediately.
    """
    try:
        # In a real system, you would want to ensure this task is only started once
        # or manage its lifecycle properly.
        asyncio.create_task(emergence_engine.enable_emergent_behaviors(agent_network))
        return {"message": "Emergence and self-organization process initiated in the background."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for the Emergence Engine.
    """
    return {"status": "ok"}
