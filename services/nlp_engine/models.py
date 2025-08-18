from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Intent(BaseModel):
    name: str
    confidence: float

class Entity(BaseModel):
    text: str
    label: str # e.g., "PERSON", "ORG", "GPE"
    start_char: int
    end_char: int

class Sentiment(BaseModel):
    polarity: float # e.g., from -1.0 (negative) to 1.0 (positive)
    subjectivity: float # e.g., from 0.0 (objective) to 1.0 (subjective)

class SemanticUnderstanding(BaseModel):
    """
    A rich representation of the semantic meaning of a user's query.
    """
    original_query: str
    intents: List[Intent] = Field(default_factory=list)
    entities: List[Entity] = Field(default_factory=list)
    sentiment: Optional[Sentiment] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    confidence: float

class GenerationConfig(BaseModel):
    """Configuration for the content generator."""
    topic: str
    audience: str # e.g., "technical", "non-technical"
    depth: str # e.g., "overview", "detailed"
    format: str = "markdown"
