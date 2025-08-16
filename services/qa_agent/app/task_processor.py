import asyncio
import json
import logging

from .core.exceptions import TaskValidationError, ArtifactError
from .test_generator import generate_pytest_file

logger = logging.getLogger(__name__)

def _find_source_code_artifact_path(artifacts: list) -> str:
    """
    Finds the path to the relevant source code artifact from the task's context.
    """
    if not artifacts:
        return None
    # A simple strategy: find the first artifact of type 'source_code'.
    # A more advanced agent might look for specific file names or metadata.
    for artifact in artifacts:
        if artifact.get("type") == "source_code" and artifact.get("path"):
            logger.info(f"Found source code artifact to test.", extra={"props": {"path": artifact.get("path")}})
            return artifact.get("path")
    return None

async def process_qa_task(task_data: dict, redis_client):
    """
    Processes a QA task by analyzing a source code artifact from the context
    and generating a corresponding test file.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    context_artifacts = task_data.get('context_artifacts', [])

    if not all([task_id, project_name]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info("Processing QA task.", extra={"props": {"task_id": task_id}})

    try:
        source_path = _find_source_code_artifact_path(context_artifacts)
        if not source_path:
            raise ArtifactError("No valid source code artifact found in task context to generate tests for.")

        # 1. Generate the test file artifact
        test_file_path = generate_pytest_file(project_name, source_path)
        generated_artifacts = [{"type": "test_suite", "path": test_file_path}]

        # 2. Notify the manager of successful completion
        completion_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "completed",
            "agent": "qa_agent",
            "artifacts": generated_artifacts
        }
        await redis_client.publish("manager_notifications", json.dumps(completion_message))
        logger.info("Successfully processed QA task and sent completion notification.", extra={"props": {"task_id": task_id}})

    except Exception as e:
        logger.error(f"An error occurred during QA task processing for task {task_id}.", exc_info=True)
        failure_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "failed",
            "agent": "qa_agent",
            "details": f"An unexpected error occurred: {str(e)}"
        }
        await redis_client.publish("manager_notifications", json.dumps(failure_message))
