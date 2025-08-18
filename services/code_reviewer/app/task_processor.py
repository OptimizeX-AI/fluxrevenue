import asyncio
import json
import logging

from services.code_reviewer.app.core.exceptions import TaskValidationError, ArtifactError
from services.code_reviewer.app.static_analyzer import analyze_code

logger = logging.getLogger(__name__)

def _find_source_code_artifact_path(artifacts: list) -> str:
    """Finds the path to the most relevant source code artifact to review."""
    if not artifacts:
        return None
    # A simple strategy: find the first artifact of type 'source_code'.
    for artifact in artifacts:
        if isinstance(artifact, dict) and artifact.get("type") == "source_code" and artifact.get("path"):
            logger.info(f"Found source code artifact to review.", extra={"props": {"path": artifact.get("path")}})
            return artifact.get("path")
    return None

async def process_review_task(task_data: dict, redis_client):
    """
    Processes a code review task by finding a source code artifact,
    analyzing it, and reporting the results.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    context_artifacts = task_data.get('context_artifacts', [])

    if not all([task_id, project_name]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info("Processing code review task.", extra={"props": {"task_id": task_id}})

    try:
        source_path = _find_source_code_artifact_path(context_artifacts)
        if not source_path:
            raise ArtifactError("No valid source code artifact found in task context to review.")

        # 1. Analyze the code
        report = analyze_code(source_path)
        generated_artifacts = [{"type": "review_report", "report": report}]

        # 2. Notify the manager of successful completion
        completion_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "completed",
            "agent": "code_reviewer",
            "artifacts": generated_artifacts
        }
        await redis_client.publish("manager_notifications", json.dumps(completion_message))
        logger.info("Successfully processed code review task.", extra={"props": {"task_id": task_id}})

    except Exception as e:
        logger.error(f"An error occurred during code review task processing for task {task_id}.", exc_info=True)
        failure_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "failed",
            "agent": "code_reviewer",
            "details": f"An unexpected error occurred: {str(e)}"
        }
        await redis_client.publish("manager_notifications", json.dumps(failure_message))
