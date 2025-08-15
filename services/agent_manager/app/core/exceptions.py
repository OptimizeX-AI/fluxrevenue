class BaseAgentException(Exception):
    """Base exception for all custom exceptions in the Agent Manager."""
    def __init__(self, message="An error occurred in the Agent Manager."):
        self.message = message
        super().__init__(self.message)

class ProjectNotFoundError(BaseAgentException):
    """Raised when a project cannot be found in the database."""
    def __init__(self, project_name: str):
        message = f"Project '{project_name}' not found."
        super().__init__(message)

class TaskValidationError(BaseAgentException):
    """Raised when a task is invalid or does not match the expected state."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.details = details or {}

class InfrastructureError(BaseAgentException):
    """Raised for issues with external services like databases or Redis."""
    def __init__(self, service_name: str, original_exception: Exception):
        message = f"An infrastructure error occurred with {service_name}."
        self.original_exception = original_exception
        super().__init__(message)
