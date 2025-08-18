from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class PerformanceMetrics(BaseModel):
    avg_response_time: Optional[float] = None
    success_rate: Optional[float] = None

class AgentMetadata(BaseModel):
    name: str = Field(..., description="The unique name of the agent.")
    version: str = Field(..., description="The version of the agent.")
    capabilities: List[str] = Field(default_factory=list, description="A list of capabilities the agent possesses.")
    supported_languages: List[str] = Field(default_factory=list, description="A list of programming languages the agent supports.")
    status: str = Field("inactive", description="The current status of the agent (e.g., active, inactive, busy).")
    last_heartbeat: Optional[datetime] = None
    performance_metrics: PerformanceMetrics = Field(default_factory=PerformanceMetrics)

class AgentRegistration(BaseModel):
    name: str
    version: str
    capabilities: List[str]
    supported_languages: List[str]
