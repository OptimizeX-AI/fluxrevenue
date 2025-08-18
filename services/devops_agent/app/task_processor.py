import json
import logging
from services.devops_agent.app.core.exceptions import TaskValidationError, ArtifactError
from services.devops_agent.app.packager import create_project_archive
from services.devops_agent.app.memory.reporter import report_to_memory

logger = logging.getLogger(__name__)


def _collect_artifact_paths(artifacts: list) -> list:
    """Collects all file paths from a list of artifact dictionaries."""
    paths = []
    if not artifacts:
        return paths
    for artifact in artifacts:
        if isinstance(artifact, dict) and artifact.get("path"):
            paths.append(artifact.get("path"))
    logger.info(f"Collected {len(paths)} artifact paths to be packaged.")
    return paths

async def process_devops_task(task_data: dict, redis_client):
    """
    Processes a DevOps task by collecting all project artifacts and packaging them.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    context_artifacts = task_data.get('context_artifacts', [])

    if not all([task_id, project_name]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    await report_to_memory(redis_client, project_name, "devops_agent", "task_started", {"task_id": task_id, "description": task_data.get("description")})

    try:
        artifact_paths = _collect_artifact_paths(context_artifacts)
        if not artifact_paths:
            logger.warning("No file artifacts found in task context to package. An empty archive will be created.")
            await report_to_memory(redis_client, project_name, "devops_agent", "action_taken", {"action_type": "packaging", "details": "No artifacts to package."})
        else:
            await report_to_memory(redis_client, project_name, "devops_agent", "action_taken", {"action_type": "packaging", "file_count": len(artifact_paths)})

        archive_path = create_project_archive(project_name, artifact_paths)
        generated_artifacts = [{"type": "project_archive", "path": archive_path}]
        await report_to_memory(redis_client, project_name, "devops_agent", "artifact_generated", {"path": archive_path})

        # Notify the manager of successful completion
        completion_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "completed",
            "agent": "devops_agent",
            "artifacts": generated_artifacts
        }
        await redis_client.publish("manager_notifications", json.dumps(completion_message))
        await report_to_memory(redis_client, project_name, "devops_agent", "task_completed", {"task_id": task_id})

    except Exception as e:
        logger.error(f"An error occurred during DevOps task processing for task {task_id}.", exc_info=True)
        await report_to_memory(redis_client, project_name, "devops_agent", "task_failed", {"task_id": task_id, "error": str(e)})

        failure_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "failed",
            "agent": "devops_agent",
            "details": f"An unexpected error occurred: {str(e)}"
        }
        await redis_client.publish("manager_notifications", json.dumps(failure_message))
