from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class AgentNetwork(BaseModel):
    """Represents the current state and structure of the agent network."""
    agent_ids: List[str]
    connections: Dict[str, List[str]] # Adjacency list representation of the network graph

class EmergentPattern(BaseModel):
    """Describes a detected emergent pattern of behavior."""
    pattern_id: str
    description: str
    involved_agents: List[str]
    utility_score: float

class ReorganizationProposal(BaseModel):
    """A proposal to change the organizational structure of the agent network."""
    proposal_id: str
    description: str
    impact_score: float
    changes: List[str] # List of proposed changes, e.g., "ADD_CONNECTION(a1, a2)"
