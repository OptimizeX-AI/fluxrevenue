from fastapi import FastAPI, HTTPException
from .models import ComplexProblem, OptimalSolution
from .ant_colony import AgentColony

app = FastAPI(
    title="Swarm Intelligence Engine",
    description="Service for solving complex optimization problems using Ant Colony Optimization.",
    version="1.0.0"
)

colony = AgentColony()

@app.post("/solve-problem", response_model=OptimalSolution)
async def solve_problem(problem: ComplexProblem):
    """
    Receives a complex problem and uses the agent colony to find an optimal solution.
    """
    try:
        solution = await colony.solve_complex_problem(problem)
        return solution
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for the Swarm Intelligence Engine.
    """
    return {"status": "ok"}
