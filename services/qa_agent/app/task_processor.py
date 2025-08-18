import json
import logging
from services.qa_agent.app.core.exceptions import TaskValidationError, ArtifactError
from services.qa_agent.app.test_generator import generate_pytest_file
from services.qa_agent.app.memory.reporter import report_to_memory

logger = logging.getLogger(__name__)


def _find_source_code_artifact_path(artifacts: list) -> str:
    """
    Finds the path to the relevant source code artifact from the task's context.
    """
    if not artifacts:
        return None
    for artifact in artifacts:
        if isinstance(artifact, dict) and artifact.get("type") == "source_code" and artifact.get("path"):
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

    await report_to_memory(redis_client, project_name, "qa_agent", "task_started", {"task_id": task_id, "description": task_data.get("description")})

    try:
        source_path = _find_source_code_artifact_path(context_artifacts)
        if not source_path:
            raise ArtifactError("No valid source code artifact found in task context to generate tests for.")

        await report_to_memory(redis_client, project_name, "qa_agent", "action_taken", {"action_type": "test_generation", "source_artifact": source_path})

        test_file_path = generate_pytest_file(project_name, source_path)
        generated_artifacts = [{"type": "test_suite", "path": test_file_path}]
        await report_to_memory(redis_client, project_name, "qa_agent", "artifact_generated", {"path": test_file_path})

        # Notify the manager of successful completion
        completion_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "completed",
            "agent": "qa_agent",
            "artifacts": generated_artifacts
        }
        await redis_client.publish("manager_notifications", json.dumps(completion_message))
        await report_to_memory(redis_client, project_name, "qa_agent", "task_completed", {"task_id": task_id})

    except Exception as e:
        logger.error(f"An error occurred during QA task processing for task {task_id}.", exc_info=True)
        await report_to_memory(redis_client, project_name, "qa_agent", "task_failed", {"task_id": task_id, "error": str(e)})

        failure_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "failed",
            "agent": "qa_agent",
            "details": f"An unexpected error occurred: {str(e)}"
        }
        await redis_client.publish("manager_notifications", json.dumps(failure_message))
