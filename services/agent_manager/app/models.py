from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB

Base = declarative_base()

class Project(Base):
    """
    Represents a single project in the system.
    """
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    requirements = Column(Text, nullable=False)
    status = Column(String, default="pending", nullable=False)

    # State field to store the project's dynamic data, such as the execution plan,
    # current task index, and artifacts. Using JSONB for efficient querying.
    state = Column(JSONB, nullable=False, server_default='{}')

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_onupdate=func.now())

    def __repr__(self):
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status}')>"
