import asyncio
import json
import logging

from services.code_architect.app.core.exceptions import TaskValidationError
from services.code_architect.app.architecture_generator import generate_architecture_document

logger = logging.getLogger(__name__)

def _make_architectural_decisions(requirements: str) -> dict:
    """
    A simple function to make high-level architectural decisions based on keywords
    found in the requirements text.
    """
    decisions = {
        "primary_language": "python",
        "backend_framework": "fastapi",
        "database_type": "postgresql",
        "frontend_framework": "none"
    }

    req_lower = requirements.lower()

    if "react" in req_lower:
        decisions["frontend_framework"] = "react"
    elif "vue" in req_lower:
        decisions["frontend_framework"] = "vue"
    elif "angular" in req_lower:
        decisions["frontend_framework"] = "angular"

    if "django" in req_lower:
        decisions["backend_framework"] = "django"

    logger.info("Made architectural decisions.", extra={"props": decisions})
    return decisions

async def process_architecture_task(task_data: dict, redis_client):
    """
    Processes an architecture design task by making decisions and generating a document.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    requirements = task_data.get('requirements', '')

    if not all([task_id, project_name, requirements]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info("Processing architecture task.", extra={"props": {"task_id": task_id}})

    try:
        # 1. Make decisions based on requirements
        decisions = _make_architectural_decisions(requirements)

        # 2. Generate the architecture document artifact
        artifact_path = generate_architecture_document(project_name, decisions)
        generated_artifacts = [{"type": "architecture_document", "path": artifact_path, "decisions": decisions}]

        # 3. Notify the manager of successful completion
        completion_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "completed",
            "agent": "code_architect",
            "artifacts": generated_artifacts
        }
        await redis_client.publish("manager_notifications", json.dumps(completion_message))
        logger.info("Successfully processed architecture task.", extra={"props": {"task_id": task_id}})

    except Exception as e:
        logger.error(f"An error occurred during architecture task processing for task {task_id}.", exc_info=True)
        failure_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "failed",
            "agent": "code_architect",
            "details": f"An unexpected error occurred: {str(e)}"
        }
        await redis_client.publish("manager_notifications", json.dumps(failure_message))
