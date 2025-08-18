from fastapi import FastAPI, HTTPException
from .models import Problem, Decision
from .decision_engine import CognitiveDecisionEngine

app = FastAPI(
    title="Cognitive Engine",
    description="Service for advanced, human-like cognitive decision-making.",
    version="1.0.0"
)

cognitive_engine = CognitiveDecisionEngine()

@app.post("/make-cognitive-decision", response_model=Decision)
async def make_cognitive_decision(problem: Problem):
    """
    Receives a complex problem and uses the cognitive engine to find a solution.
    """
    try:
        decision = await cognitive_engine.make_cognitive_decision(problem, problem.context)
        return decision
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for the Cognitive Engine.
    """
    return {"status": "ok"}
