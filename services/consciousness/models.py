from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class SelfModel(BaseModel):
    """A multi-faceted representation of the system's understanding of itself."""
    structural: Dict[str, Any]
    functional: Dict[str, Any]
    behavioral: Dict[str, Any]
    temporal_evolution: List[str]

class Action(BaseModel):
    """Represents an action taken by the system."""
    action_id: str
    intention: str

class Outcome(BaseModel):
    """Represents the result of an action."""
    outcome_id: str
    result: Any

class Reflection(BaseModel):
    """Represents the system's reflection on a past action."""
    action: Action
    outcome: Outcome
    analysis: Dict[str, Any]
    lessons: List[str]

class ConsciousnessState(BaseModel):
    """A snapshot of the system's state of consciousness."""
    awareness: float
    attention: float
    integration: float
    intentions: List[str]
    goals: Dict[str, float] # goal -> progress
    emotions: Dict[str, float] # emotion -> intensity
    self_awareness: float
    timestamp: datetime = Field(default_factory=datetime.now)
