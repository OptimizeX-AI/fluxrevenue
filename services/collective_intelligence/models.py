from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Proposal(BaseModel):
    """Represents a proposal to be decided upon by a group of agents."""
    proposal_id: str
    description: str
    proposed_by: str # agent_id

class ConsensusResult(BaseModel):
    """The result of a distributed consensus process."""
    decision: Any
    convergence_rounds: int
    agreement_level: float # e.g., percentage of agents in agreement

class Resource(BaseModel):
    """A resource to be allocated via negotiation."""
    resource_id: str
    resource_type: str # e.g., "cpu_core", "gpu_session"

class Allocation(BaseModel):
    """A map of resource_id to agent_id."""
    allocation_map: Dict[str, str]

class AllocationResult(BaseModel):
    """The result of a multi-agent negotiation for resources."""
    allocation: Allocation
    efficiency: float # e.g., Pareto efficiency score
    fairness: float # e.g., Gini coefficient
