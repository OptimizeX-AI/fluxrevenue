class BaseAgentException(Exception):
    """Base exception for all custom exceptions in the Developer Agent."""
    def __init__(self, message="An error occurred in the Developer Agent."):
        self.message = message
        super().__init__(self.message)

class TaskValidationError(BaseAgentException):
    """Raised when a task is invalid or missing required information."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.details = details or {}

class CodeGenerationError(BaseAgentException):
    """Raised when an error occurs during code generation."""
    def __init__(self, message: str, template: str = None):
        super().__init__(message)
        self.template = template

class InfrastructureError(BaseAgentException):
    """Raised for issues with external services like file system or Redis."""
    def __init__(self, service_name: str, original_exception: Exception):
        message = f"An infrastructure error occurred with {service_name}."
        self.original_exception = original_exception
        super().__init__(message)
