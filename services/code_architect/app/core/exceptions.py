class BaseAgentException(Exception):
    """Base exception for all custom exceptions in the Code Architect Agent."""
    def __init__(self, message="An error occurred in the Code Architect Agent."):
        self.message = message
        super().__init__(self.message)

class TaskValidationError(BaseAgentException):
    """Raised when a task is invalid or missing required information."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.details = details or {}

class ArchitectureDecisionError(BaseAgentException):
    """Raised when an error occurs during architectural decision making."""
    def __init__(self, message: str):
        super().__init__(message)
