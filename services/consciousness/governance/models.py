from pydantic import BaseModel
from typing import Any, Dict

class EthicalJudgment(BaseModel):
    """Represents the ethical evaluation of a proposed action or decision."""
    is_ethical: bool
    reason: str
    confidence: float

class DecisionContext(BaseModel):
    """A placeholder for the context of a decision to be evaluated."""
    action_name: str
    parameters: Dict[str, Any]
    projected_impact: str

class GovernanceResponse(BaseModel):
    """The response from the GovernanceEngine after reviewing a decision."""
    approved: bool
    reason: str
