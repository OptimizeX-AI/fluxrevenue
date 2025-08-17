"""
SQLAlchemy models for the Memory Agent's database.
This defines the structure for how the agent remembers project events and key decisions.
"""
from sqlalchemy import Column, Integer, String, DateTime, func, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ProjectEvent(Base):
    """
    Represents a single event or action that occurred during a project's lifecycle.
    This serves as a detailed, immutable log of everything that happens.
    """
    __tablename__ = "project_events"

    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String, index=True, nullable=False)
    source_agent = Column(String, nullable=False, index=True)
    event_type = Column(String, index=True, nullable=False)
    data = Column(JSON) # Flexible JSON blob for any event-specific data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ProjectEvent(project='{self.project_name}', agent='{self.source_agent}', event='{self.event_type}')>"

class ProjectDecision(Base):
    """
    Represents a key architectural or strategic decision made for a project.
    This table is used for quick lookups to perform coherence checks.
    """
    __tablename__ = "project_decisions"

    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String, index=True, nullable=False)
    decision_key = Column(String, nullable=False, index=True)
    decision_value = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ProjectDecision(project='{self.project_name}', key='{self.decision_key}', value='{self.decision_value}')>"
