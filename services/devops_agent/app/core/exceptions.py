class BaseAgentException(Exception):
    """Base exception for all custom exceptions in the DevOps Agent."""
    def __init__(self, message="An error occurred in the DevOps Agent."):
        self.message = message
        super().__init__(self.message)

class TaskValidationError(BaseAgentException):
    """Raised when a task is invalid or missing required information."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.details = details or {}

class ArtifactError(BaseAgentException):
    """Raised when an expected artifact is missing or invalid."""
    def __init__(self, message: str, path: str = None):
        super().__init__(message)
        self.path = path

class PackagingError(BaseAgentException):
    """Raised when an error occurs during project packaging."""
    def __init__(self, message: str):
        super().__init__(message)
