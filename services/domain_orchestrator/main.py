from fastapi import FastAPI, HTTPException
from .models import MultiDomainProject, ProjectResult
from .domain_orchestration_manager import DomainOrchestrationManager

app = FastAPI(
    title="Domain Orchestrator",
    description="Orchestrates complex, multi-domain projects.",
    version="1.0.0"
)

orchestrator = DomainOrchestrationManager()

@app.post("/orchestrate", response_model=ProjectResult)
async def orchestrate_project(project: MultiDomainProject):
    """
    Receives a multi-domain project and orchestrates its execution.
    """
    try:
        result = await orchestrator.orchestrate_multi_domain_project(project)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
