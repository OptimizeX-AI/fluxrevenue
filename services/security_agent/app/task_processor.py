import asyncio
import json
import logging

from services.security_agent.app.core.exceptions import TaskValidationError, ArtifactError
from services.security_agent.app.security_analyzer import analyze_code_for_vulnerabilities

logger = logging.getLogger(__name__)

def _find_source_code_artifact_paths(artifacts: list) -> list:
    """
    Finds all paths to relevant source code artifacts from the task's context.
    A security scan should run on all available source code.
    """
    paths = []
    if not artifacts:
        return paths
    for artifact in artifacts:
        if isinstance(artifact, dict) and artifact.get("type") == "source_code" and artifact.get("path"):
            paths.append(artifact.get("path"))
    logger.info(f"Found {len(paths)} source code artifacts to scan.")
    return paths

async def process_security_task(task_data: dict, redis_client):
    """
    Processes a security task by analyzing source code artifacts from the context.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    context_artifacts = task_data.get('context_artifacts', [])

    if not all([task_id, project_name]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info("Processing security analysis task.", extra={"props": {"task_id": task_id}})

    try:
        source_paths = _find_source_code_artifact_paths(context_artifacts)
        if not source_paths:
            raise ArtifactError("No valid source code artifacts found in task context to scan.")

        full_report = {}
        for path in source_paths:
            report = analyze_code_for_vulnerabilities(path)
            full_report[path] = report

        generated_artifacts = [{"type": "security_report", "report": full_report}]

        # Notify the manager of successful completion
        completion_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "completed",
            "agent": "security_agent",
            "artifacts": generated_artifacts
        }
        await redis_client.publish("manager_notifications", json.dumps(completion_message))
        logger.info("Successfully processed security task and sent completion notification.", extra={"props": {"task_id": task_id}})

    except Exception as e:
        logger.error(f"An error occurred during security task processing for task {task_id}.", exc_info=True)
        failure_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "failed",
            "agent": "security_agent",
            "details": f"An unexpected error occurred: {str(e)}"
        }
        await redis_client.publish("manager_notifications", json.dumps(failure_message))
