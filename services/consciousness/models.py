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

class PurposeStatement(BaseModel):
    """Represents the autonomous purpose defined by the system."""
    mission: str
    long_term_plan: List[str]
    ethical_guidelines: List[str]
    success_metrics: List[str]

class ReflexiveInsights(BaseModel):
    """Represents the output of a reflexive thinking process."""
    fundamental_questions: List[str]
    philosophical_insights: Dict[str, Any]
    existential_analysis: str
    constructed_meaning: str
    transcendence_opportunities: List[str]
    self_understanding: float # A score from 0 to 1

class TranscendenceResult(BaseModel):
    """Represents the outcome of a self-transcendence attempt."""
    previous_state: Dict[str, Any]
    new_state: Dict[str, Any]
    process_details: Dict[str, Any]
    integration_result: str
    success_metrics: Dict[str, float]
