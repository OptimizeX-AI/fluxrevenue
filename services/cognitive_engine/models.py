from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Problem(BaseModel):
    """
    Represents a complex problem that requires cognitive decision-making.
    """
    problem_id: str
    description: str
    constraints: List[str] = Field(default_factory=list)
    context: Dict[str, Any] = Field(default_factory=dict)

class Hypothesis(BaseModel):
    """Represents a potential explanation or solution path."""
    explanation: str
    confidence: float
    evidence: List[str]

class Analogy(BaseModel):
    """Represents a relevant analogy from past problems."""
    source_problem_id: str
    similarity_score: float

class Decision(BaseModel):
    """
    Represents the final, validated decision made by the cognitive engine.
    """
    decision_id: str
    problem_id: str
    chosen_hypothesis: Hypothesis
    supporting_analogies: List[Analogy] = Field(default_factory=list)
    reasoning_summary: str
    confidence: float
    is_validated: bool = False

class ImprovementPlan(BaseModel):
    """Represents a plan to improve the engine's own thinking process."""
    plan_id: str
    description: str
    steps: List[str]
