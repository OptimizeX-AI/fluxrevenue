import json
import logging
import os

# Import the new testing framework components
from .test_generator_factory import TestGeneratorFactory
from .core.exceptions import TaskValidationError, ArtifactError
from message_broker.rabbitmq_client import RabbitMQClient

logger = logging.getLogger(__name__)

def _find_source_code_artifact(artifacts: list) -> dict:
    """Finds the first source code artifact in a list."""
    for artifact in artifacts:
        if isinstance(artifact, dict) and artifact.get("type") == "source_code":
            return artifact
    return None

def process_qa_task(task_data: dict, rabbitmq_client: RabbitMQClient):
    """
    Processes a QA task using the new test generator framework.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    description = task_data.get('description', '').lower()
    context_artifacts = task_data.get('context_artifacts', [])

    if not all([task_id, project_name, description]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info(f"Processing QA task {task_id} with new framework.")

    factory = TestGeneratorFactory()
    generated_artifacts = []
    status = "completed"

    try:
        # 1. Determine the type of test to generate from the description
        # This is a simple keyword-based approach.
        test_type = "unit" # default
        if "integration" in description:
            test_type = "integration"
        elif "performance" in description:
            test_type = "performance"
        elif "e2e" in description:
            test_type = "e2e"

        # 2. Find the source code to test
        code_artifact = _find_source_code_artifact(context_artifacts)
        if not code_artifact:
            raise ArtifactError("No source code artifact found to generate tests for.")

        language = code_artifact.get("language", "python") # Assume python if not specified

        # 3. Use the factory to get the correct generator
        generator = factory.get_generator(language, test_type)
        if not generator:
            raise NotImplementedError(f"No '{test_type}' test generator available for '{language}'.")

        # 4. Generate the test code
        # The spec could be more detailed, here we just pass the function name to test
        test_spec = {"function_name": "my_function"} # This needs to be smarter
        test_code = generator.generate(code_artifact, test_spec)

        # 5. Save the generated test file
        workspace_dir = f"workspace/{project_name.replace(' ', '_').lower()}/tests"
        os.makedirs(workspace_dir, exist_ok=True)
        test_file_path = os.path.join(workspace_dir, f"test_{test_type}_generated.py")

        with open(test_file_path, "w") as f:
            f.write(test_code)

        generated_artifacts.append({"type": f"{test_type}_test_suite", "path": test_file_path})
        logger.info(f"Generated {test_type} test file at {test_file_path}")

    except Exception as e:
        logger.error(f"An error occurred during QA task processing for task {task_id}.", exc_info=True)
        status = "failed"
        generated_artifacts = [{"type": "error_report", "details": f"An unexpected error occurred: {str(e)}"}]

    # 6. Send final notification to the agent manager
    completion_message = {
        "task_id": task_id,
        "project_name": project_name,
        "status": status,
        "agent": "qa_agent",
        "artifacts": generated_artifacts
    }

    message = RabbitMQClient.create_message(
        source_agent="qa_agent",
        target_agent="agent_manager",
        task_type="task_completion_notification",
        payload=completion_message
    )
    rabbitmq_client.publish_message("manager_notifications", message)
    logger.info(f"Reported status '{status}' for QA task {task_id}.")
