from fastapi import FastAPI, HTTPException
from .models import SelfModel, Action, Outcome, Reflection
from .self_model import SelfModelEngine
from .state_monitor import ConsciousnessStateMonitor

app = FastAPI(
    title="Consciousness Engine",
    description="Service for self-modeling, reflection, and other consciousness-related processes.",
    version="1.0.0"
)

self_model_engine = SelfModelEngine()
state_monitor = ConsciousnessStateMonitor()

@app.post("/build-self-model", response_model=SelfModel)
async def build_self_model():
    """
    Triggers the construction of the system's self-model.
    """
    try:
        model = await self_model_engine.build_self_model()
        return model
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.post("/reflect-on-action", response_model=Reflection)
async def reflect_on_action(action: Action, outcome: Outcome):
    """
    Triggers a reflection process on a given action and its outcome.
    """
    try:
        reflection = await self_model_engine.reflect_on_action(action, outcome)
        return reflection
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for the Consciousness Engine.
    """
    return {"status": "ok"}
