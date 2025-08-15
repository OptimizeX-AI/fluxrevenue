import asyncio
import json
import logging

import json
import logging
from services.developer_agent.app.core.exceptions import TaskValidationError, CodeGenerationError
from services.developer_agent.app.code_generator import generate_fastapi_endpoint

logger = logging.getLogger(__name__)


async def process_development_task(task_data: dict, redis_client):
    """
    Processes a development task by interpreting its description, triggering
    code generation, and notifying the manager upon completion.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    description = task_data.get('description', '').lower()

    if not all([task_id, project_name, description]):
        raise TaskValidationError("Task data is missing required fields (task_id, project_name, description).", details=task_data)

    logger.info("Processing development task.", extra={"props": {"task_id": task_id, "project_name": project_name}})

    try:
        # 1. Interpretation and Code Generation
        # Simple routing based on task description keywords.
        if "api" in description and "endpoint" in description:
            artifact_path = generate_fastapi_endpoint(project_name, description)
        else:
            # In a real system, you might generate a different type of file
            # or raise an error for an unrecognized task.
            logger.warning("Task description did not match a known code generation pattern.", extra={"props": {"description": description}})
            artifact_path = "workspace/unrecognized_task.txt"
            with open(artifact_path, "w") as f:
                f.write(f"Unrecognized task: {description}")

        generated_artifacts = [{"type": "source_code", "path": artifact_path}]

        # 2. Notify the manager of successful completion
        completion_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "completed",
            "agent": "developer_agent",
            "artifacts": generated_artifacts
        }
        await redis_client.publish("manager_notifications", json.dumps(completion_message))
        logger.info("Successfully processed task and sent completion notification.", extra={"props": {"task_id": task_id}})

    except Exception as e:
        # Catch any exception during processing, log it, and notify the manager of the failure.
        logger.error(f"An error occurred while processing task {task_id}.", exc_info=True)

        failure_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "failed",
            "agent": "developer_agent",
            "details": f"An unexpected error occurred: {str(e)}"
        }
        await redis_client.publish("manager_notifications", json.dumps(failure_message))
