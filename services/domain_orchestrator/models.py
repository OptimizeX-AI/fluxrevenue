from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Task(BaseModel):
    """Represents a single task within a multi-domain project."""
    task_id: str
    description: str
    # The domain can be explicitly provided or will be inferred by the orchestrator
    domain: Optional[str] = None
    dependencies: List[str] = Field(default_factory=list)
    # The data payload required to execute the task
    data: Dict[str, Any] = Field(default_factory=dict)

class MultiDomainProject(BaseModel):
    """Represents a complex project that spans multiple domains."""
    project_id: str
    project_name: str
    tasks: List[Task]

class ProjectResult(BaseModel):
    """Represents the final result of an orchestrated project."""
    project_id: str
    status: str # e.g., "completed", "failed"
    results: Dict[str, Any] = Field(default_factory=dict) # Aggregated results from all tasks

class CoordinationResult(BaseModel):
    """Represents the result of the cross-domain coordination analysis."""
    status: str
    communication_channels: List[str]
    data_flows: List[str]
