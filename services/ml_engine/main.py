from fastapi import FastAPI, HTTPException
from typing import Any, Dict
from .ml_framework import MLFramework

app = FastAPI(
    title="ML Engine",
    description="Service for training, optimizing, and serving ML models for the FluxRevenue system.",
    version="1.0.0"
)

ml_framework = MLFramework()

@app.post("/train/decision_model", status_code=202)
async def train_decision_model_endpoint(training_data: Dict[str, Any]):
    """
    An asynchronous endpoint to trigger the training of a new decision model.
    Accepts training data and returns a confirmation response.
    """
    try:
        # In a real system, you might run this as a background task
        result = await ml_framework.train_decision_model(training_data)
        return {"message": "Decision model training initiated successfully.", "details": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred during training: {e}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for the ML Engine.
    """
    return {"status": "ok"}
