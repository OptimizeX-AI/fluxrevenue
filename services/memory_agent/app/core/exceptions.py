class BaseAgentException(Exception):
    """Base exception for all custom exceptions in the Memory Agent."""
    def __init__(self, message="An error occurred in the Memory Agent."):
        self.message = message
        super().__init__(self.message)

class EventValidationError(BaseAgentException):
    """Raised when an incoming event is invalid or missing required information."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.details = details or {}

class MemoryStorageError(BaseAgentException):
    """Raised when an error occurs during database persistence."""
    def __init__(self, message: str, original_exception: Exception = None):
        super().__init__(message)
        self.original_exception = original_exception
