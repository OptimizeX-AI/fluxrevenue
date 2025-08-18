import json
import logging
from services.developer_agent.app.core.exceptions import TaskValidationError, CodeGenerationError
from services.developer_agent.app.code_generator import generate_fastapi_endpoint
from services.developer_agent.app.memory.reporter import report_to_memory

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

    await report_to_memory(redis_client, project_name, "developer_agent", "task_started", {"task_id": task_id, "description": description})

    try:
        # Interpretation and Code Generation
        if "api" in description and "endpoint" in description:
            # This is where the coherence check matters. The generator implicitly uses "fastapi".
            # We report this action to the memory agent, which can check it against the "backend_framework" decision.
            action_data = {"action_type": "code_generation", "framework_used": "fastapi", "details": description}
            await report_to_memory(redis_client, project_name, "developer_agent", "action_taken", action_data)

            artifact_path = generate_fastapi_endpoint(project_name, description)
        else:
            logger.warning("Task description did not match a known code generation pattern.", extra={"props": {"description": description}})
            artifact_path = f"workspace/{project_name.replace(' ', '_').lower()}/unrecognized_task.txt"
            with open(artifact_path, "w") as f:
                f.write(f"Unrecognized task: {description}")

        generated_artifacts = [{"type": "source_code", "path": artifact_path}]
        await report_to_memory(redis_client, project_name, "developer_agent", "artifact_generated", {"path": artifact_path})

        # Notify the manager of successful completion
        completion_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "completed",
            "agent": "developer_agent",
            "artifacts": generated_artifacts
        }
        await redis_client.publish("manager_notifications", json.dumps(completion_message))
        await report_to_memory(redis_client, project_name, "developer_agent", "task_completed", {"task_id": task_id})

    except Exception as e:
        logger.error(f"An error occurred during development task processing for task {task_id}.", exc_info=True)
        await report_to_memory(redis_client, project_name, "developer_agent", "task_failed", {"task_id": task_id, "error": str(e)})

        failure_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "failed",
            "agent": "developer_agent",
            "details": f"An unexpected error occurred: {str(e)}"
        }
        await redis_client.publish("manager_notifications", json.dumps(failure_message))
