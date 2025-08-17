import json
import logging
from services.code_architect.app.core.exceptions import TaskValidationError
from services.code_architect.app.architecture_generator import generate_architecture_document
from services.code_architect.app.memory.reporter import report_to_memory

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

    await report_to_memory(redis_client, project_name, "code_architect", "task_started", {"task_id": task_id, "description": task_data.get("description")})

    try:
        decisions = _make_architectural_decisions(requirements)

        # Report each decision to memory
        for key, value in decisions.items():
            await report_to_memory(redis_client, project_name, "code_architect", "decision_made", {"key": key, "value": value})

        artifact_path = generate_architecture_document(project_name, decisions)
        generated_artifacts = [{"type": "architecture_document", "path": artifact_path, "decisions": decisions}]
        await report_to_memory(redis_client, project_name, "code_architect", "artifact_generated", {"path": artifact_path})

        completion_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "completed",
            "agent": "code_architect",
            "artifacts": generated_artifacts
        }
        await redis_client.publish("manager_notifications", json.dumps(completion_message))
        await report_to_memory(redis_client, project_name, "code_architect", "task_completed", {"task_id": task_id})

    except Exception as e:
        logger.error(f"An error occurred during architecture task processing for task {task_id}.", exc_info=True)
        await report_to_memory(redis_client, project_name, "code_architect", "task_failed", {"task_id": task_id, "error": str(e)})
        failure_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "failed",
            "agent": "code_architect",
            "details": f"An unexpected error occurred: {str(e)}"
        }
        await redis_client.publish("manager_notifications", json.dumps(failure_message))
