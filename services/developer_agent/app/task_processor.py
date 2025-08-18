import json
import logging
import os

# Import the new multi-language framework components
from services.common.multi_language.language_detector import SimpleLanguageDetector
from services.common.multi_language.python_parser import PythonParser
from services.common.multi_language.python_generator import PythonCodeGenerator

from .core.exceptions import TaskValidationError
from message_broker.rabbitmq_client import RabbitMQClient

logger = logging.getLogger(__name__)

def process_development_task(task_data: dict, rabbitmq_client: RabbitMQClient):
    """
    Processes a development task using the multi-language framework.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    description = task_data.get('description', '').lower()

    if not all([task_id, project_name, description]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info(f"Processing development task {task_id} with new framework.")

    # --- Initialize Framework Components ---
    detector = SimpleLanguageDetector()
    # In a more advanced system, we would have a factory to get the right
    # parser/generator based on the detected language.
    python_generator = PythonCodeGenerator()
    python_parser = PythonParser()

    generated_artifacts = []
    status = "completed"

    try:
        # 1. Detect intent from description
        if "generate" in description and "python" in description:
            # Generate a new file
            spec = {"type": "basic_fastapi", "project_name": project_name}
            file_content = python_generator.generate_file(spec)

            # Ensure workspace directory exists
            workspace_dir = f"workspace/{project_name.replace(' ', '_').lower()}"
            os.makedirs(workspace_dir, exist_ok=True)
            artifact_path = os.path.join(workspace_dir, "main.py")

            with open(artifact_path, "w") as f:
                f.write(file_content)

            generated_artifacts.append({"type": "source_code", "path": artifact_path, "language": "python", "content": file_content})
            logger.info(f"Generated Python file at {artifact_path}")

        elif "analyze" in description and "python" in description:
            # Analyze an existing file (assuming it's in the context)
            source_code = ""
            for artifact in task_data.get("context_artifacts", []):
                if artifact.get("language") == "python":
                    source_code = artifact.get("content", "")
                    break

            if source_code:
                analysis_result = python_parser.analyze(source_code)
                generated_artifacts.append({"type": "code_analysis_report", "report": analysis_result})
                logger.info("Analyzed Python source code.")
            else:
                raise ValueError("No Python source code found in context for analysis.")

        else:
            logger.warning("Task description did not match a known pattern.", extra={"props": {"description": description}})
            status = "failed"
            generated_artifacts.append({"type": "error_report", "details": "Could not understand the task."})

    except Exception as e:
        logger.error(f"An error occurred during development task processing for task {task_id}.", exc_info=True)
        status = "failed"
        generated_artifacts = [{"type": "error_report", "details": f"An unexpected error occurred: {str(e)}"}]

    # Notify the manager of the outcome
    completion_message = {
        "task_id": task_id,
        "project_name": project_name,
        "status": status,
        "agent": "developer_agent",
        "artifacts": generated_artifacts
    }

    message = RabbitMQClient.create_message(
        source_agent="developer_agent",
        target_agent="agent_manager",
        task_type="task_completion_notification",
        payload=completion_message
    )
    rabbitmq_client.publish_message("manager_notifications", message)
    logger.info(f"Reported status '{status}' for development task {task_id}.")
