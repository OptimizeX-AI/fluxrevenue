# Contributing to the AI Agent Ecosystem

This document provides development standards and guidelines for all agents within this project. Adhering to these standards is crucial for maintaining code quality, consistency, and ensuring the coordinated evolution of the entire ecosystem.

## 1. Code Style and Structure

All Python code must adhere to the [PEP 8 Style Guide](https://www.python.org/dev/peps/pep-0008/).

### 1.1. Import Formatting

Imports should be sorted alphabetically and grouped. We use `isort` for this. A typical import block should look like this:

```python
# 1. Standard library imports
import json
import logging

# 2. Third-party imports
import redis
from fastapi import FastAPI
from sqlalchemy.orm import Session

# 3. Local application/library specific imports
from .database import SessionLocal
from .models import Project
```

### 1.2. Directory Structure

Each agent service must follow this standardized directory structure. The existing services will be refactored towards this structure over time.

```
services/{agent_name}/
├── tests/                  # Unit and integration tests
│   ├── __init__.py
│   └── test_{feature}.py
├── app/                    # Main application source code
│   ├── __init__.py
│   ├── main.py             # FastAPI application entry point
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas for API validation
│   ├── crud.py             # Database create, read, update, delete operations
│   └── core/               # Core logic, configurations
│       ├── config.py
│       └── exceptions.py   # Custom exceptions
├── Dockerfile
└── requirements.txt
```

## 2. Structured Logging

All services must use structured logging in JSON format. This allows for effective parsing, searching, and monitoring in a production environment (e.g., with an ELK stack). `print()` statements for debugging are discouraged and should be replaced by log messages.

### 2.1. Logger Configuration

Use the standard Python `logging` library with `python-json-logger`. This dependency must be added to each agent's `requirements.txt`.

**Example Configuration (`app/core/config.py`):**
```python
import logging
import sys
from pythonjsonlogger import jsonlogger

def setup_logging(log_level="INFO"):
    logger = logging.getLogger()
    logger.setLevel(log_level)
    logHandler = logging.StreamHandler(sys.stdout)
    formatter = jsonlogger.JsonFormatter(
        '%(asctime)s %(name)s %(levelname)s %(message)s'
    )
    logHandler.setFormatter(formatter)

    # Avoid adding duplicate handlers
    if not logger.handlers:
        logger.addHandler(logHandler)
```

### 2.2. Usage

Provide context as an `extra` dictionary for rich, searchable logs.

```python
import logging

logger = logging.getLogger(__name__)

# Example usage
def process_task(task_id: int):
    logger.info(
        "Processing task",
        extra={"props": {"task_id": task_id, "status": "started"}}
    )
    try:
        # ... task logic ...
        logger.info(
            "Task processed successfully",
            extra={"props": {"task_id": task_id, "status": "completed"}}
        )
    except Exception as e:
        logger.error(
            "Task processing failed",
            extra={"props": {"task_id": task_id, "error_message": str(e)}},
            exc_info=True
        )
```

## 3. Exception Handling

Do not use generic `except Exception:`. Each agent should define and use a set of custom exceptions for predictable error handling and control flow.

### 3.1. Custom Exception Hierarchy

Create an `exceptions.py` file in each agent's `app/core/` directory. All custom exceptions should inherit from a common `BaseAgentException`.

**Example (`app/core/exceptions.py`):**
```python
class BaseAgentException(Exception):
    """Base exception for this agent."""
    def __init__(self, message="An error occurred in the agent."):
        self.message = message
        super().__init__(self.message)

class TaskValidationError(BaseAgentException):
    """Raised when incoming task validation fails."""
    def __init__(self, message="Task validation failed.", details: dict = None):
        super().__init__(message)
        self.details = details or {}

class InfrastructureError(BaseAgentException):
    """Raised for issues with external services like databases or Redis."""
    def __init__(self, message="An infrastructure error occurred.", service_name: str = None):
        super().__init__(message)
        self.service_name = service_name
```

### 3.2. Usage

Catch specific exceptions and log them with context. This allows for better monitoring and alerting.

```python
from .core.exceptions import TaskValidationError, InfrastructureError

try:
    # ... logic ...
except TaskValidationError as e:
    logger.warning("Validation failed for task", extra={"props": {"details": e.details}})
    # Handle validation error, e.g., by sending a notification
except InfrastructureError as e:
    logger.error(
        "Infrastructure error communicating with service",
        extra={"props": {"service": e.service_name}},
        exc_info=True
    )
    # Handle infrastructure error, e.g., by retrying
except Exception as e:
    logger.critical("An unexpected critical error occurred", exc_info=True)
    # Re-raise or handle unexpected errors gracefully
```
