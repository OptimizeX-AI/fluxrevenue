from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ComplexProblem(BaseModel):
    """
    Represents a complex optimization problem to be solved by the agent colony.
    """
    problem_id: str
    domain: str
    description: str
    constraints: Dict[str, Any] = Field(default_factory=dict)

class Solution:
    """Represents a potential solution found by an agent."""
    agent_id: str
    path: List[Any] # The sequence of steps or components in the solution
    quality: float = 0.0 # A score indicating how good the solution is

class OptimalSolution(BaseModel):
    """
    Represents the final, optimized solution synthesized from the colony's efforts.
    """
    problem_id: str
    solution: Solution
    confidence: float
    iterations: int
    convergence_status: str
