import json
import logging

# Import the new architecture components
from .design_patterns import DesignPatternCatalog
from .complexity_analyzer import ComplexityAnalyzer
from .diagram_generator import DiagramGenerator
from .architecture_generator import generate_architecture_spec # Assuming this is the main generator

from .core.exceptions import TaskValidationError
from message_broker.rabbitmq_client import RabbitMQClient

logger = logging.getLogger(__name__)

def process_architecture_task(task_data: dict, rabbitmq_client: RabbitMQClient):
    """
    Processes an architecture design task using the new advanced components.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    requirements = task_data.get('requirements', '')

    if not all([task_id, project_name, requirements]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info(f"Processing architecture task {task_id} with advanced components.")

    # --- Initialize Components ---
    pattern_catalog = DesignPatternCatalog()
    complexity_analyzer = ComplexityAnalyzer()
    diagram_generator = DiagramGenerator()

    final_artifacts = []
    status = "completed"

    try:
        # 1. Generate the core architecture specification
        # This function now returns a structured spec instead of writing a file.
        architecture_spec = generate_architecture_spec(project_name, requirements)

        # 2. Suggest relevant design patterns
        suggested_patterns = pattern_catalog.suggest_patterns(requirements)

        # 3. Analyze the complexity of the generated architecture
        complexity_report = complexity_analyzer.analyze(architecture_spec)

        # 4. Generate a text-based diagram
        diagram_markdown = diagram_generator.generate_markdown(architecture_spec)

        # 5. Assemble the final artifact
        # This is a comprehensive report instead of just a document path.
        final_report = {
            "architecture_specification": architecture_spec,
            "suggested_design_patterns": suggested_patterns,
            "complexity_analysis": complexity_report,
            "diagram": diagram_markdown
        }
        final_artifacts.append({"type": "architecture_report", "report": final_report})

        logger.info(f"Successfully generated comprehensive architecture report for task {task_id}.")

    except Exception as e:
        logger.error(f"An error occurred during architecture task processing for task {task_id}.", exc_info=True)
        status = "failed"
        final_artifacts = [{"type": "error_report", "details": f"An unexpected error occurred: {str(e)}"}]

    # 6. Send final notification to the agent manager
    completion_message = {
        "task_id": task_id,
        "project_name": project_name,
        "status": status,
        "agent": "code_architect",
        "artifacts": final_artifacts
    }

    message = RabbitMQClient.create_message(
        source_agent="code_architect",
        target_agent="agent_manager",
        task_type="task_completion_notification",
        payload=completion_message
    )
    rabbitmq_client.publish_message("manager_notifications", message)
    logger.info(f"Reported status '{status}' for architecture task {task_id}.")
