import asyncio
import json
import logging
import re

from .core.exceptions import TaskValidationError
from .schema_generator import generate_sqlalchemy_models

logger = logging.getLogger(__name__)

def _extract_entities_from_description(description: str) -> list:
    """
    A simple regex-based parser to extract entities from a task description.
    Example: "Design database schema to support features: users, products" -> ["users", "products"]
    """
    match = re.search(r"features: (.*)", description, re.IGNORECASE)
    if match:
        # Split by comma and strip whitespace from each entity
        entities = [e.strip() for e in match.group(1).split(",")]
        logger.info(f"Extracted entities from description: {entities}")
        return entities

    logger.warning("No entities found in description via regex.", extra={"props": {"description": description}})
    return []

async def process_schema_task(task_data: dict, redis_client):
    """
    Processes a database schema design task.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    description = task_data.get('description', '')

    if not all([task_id, project_name, description]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info("Processing schema design task.", extra={"props": {"task_id": task_id}})

    try:
        entities = _extract_entities_from_description(description)
        if not entities:
            logger.warning("Could not extract entities. Creating a default 'item' model.")
            entities = ["item"]

        artifact_path = generate_sqlalchemy_models(project_name, entities)
        generated_artifacts = [{"type": "sqlalchemy_model", "path": artifact_path}]

        completion_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "completed",
            "agent": "database_architect",
            "artifacts": generated_artifacts
        }
        await redis_client.publish("manager_notifications", json.dumps(completion_message))
        logger.info("Successfully processed schema task and sent completion notification.", extra={"props": {"task_id": task_id}})

    except Exception as e:
        logger.error(f"An error occurred during schema task processing for task {task_id}.", exc_info=True)
        failure_message = {
            "task_id": task_id,
            "project_name": project_name,
            "status": "failed",
            "agent": "database_architect",
            "details": f"An unexpected error occurred: {str(e)}"
        }
        await redis_client.publish("manager_notifications", json.dumps(failure_message))
