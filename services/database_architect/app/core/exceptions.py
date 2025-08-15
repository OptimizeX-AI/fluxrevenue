class BaseAgentException(Exception):
    """Base exception for all custom exceptions in the Database Architect Agent."""
    def __init__(self, message="An error occurred in the Database Architect Agent."):
        self.message = message
        super().__init__(self.message)

class TaskValidationError(BaseAgentException):
    """Raised when a task is invalid or missing required information."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.details = details or {}

class SchemaGenerationError(BaseAgentException):
    """Raised when an error occurs during schema generation."""
    def __init__(self, message: str, entities: list = None):
        super().__init__(message)
        self.entities = entities or []

class InfrastructureError(BaseAgentException):
    """Raised for issues with external services like file system or Redis."""
    def __init__(self, service_name: str, original_exception: Exception):
        message = f"An infrastructure error occurred with {service_name}."
        self.original_exception = original_exception
        super().__init__(message)
