import json
import logging

from .core.exceptions import TaskValidationError, ArtifactError
from .static_analyzer import analyze_code
from .critical_analysis import CriticalAnalysis

# This client is now passed from main.py
from message_broker.rabbitmq_client import RabbitMQClient

logger = logging.getLogger(__name__)

def _find_source_code_artifact_path(artifacts: list) -> str:
    """Finds the path to the most relevant source code artifact to review."""
    if not artifacts:
        return None
    for artifact in artifacts:
        if isinstance(artifact, dict) and artifact.get("type") == "source_code" and artifact.get("path"):
            logger.info(f"Found source code artifact to review.", extra={"props": {"path": artifact.get("path")}})
            return artifact.get("path")
    return None

def process_review_task(task_data: dict, rabbitmq_client: RabbitMQClient):
    """
    Processes a code review task, analyzes the output critically, and reports the results.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    context_artifacts = task_data.get('context_artifacts', [])

    if not all([task_id, project_name]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info("Processing code review task.", extra={"props": {"task_id": task_id}})

    analysis_module = CriticalAnalysis()
    final_artifacts = []

    try:
        source_path = _find_source_code_artifact_path(context_artifacts)
        if not source_path:
            raise ArtifactError("No valid source code artifact found in task context to review.")

        # 1. Analyze the code
        report = analyze_code(source_path)

        # 2. Perform critical analysis on the generated report
        analysis_result = analysis_module.analyze_output([report])

        if not analysis_result["is_valid"]:
            logger.warning(f"Initial review report for task {task_id} failed critical analysis. Feedback: {analysis_result['feedback']}")
            # Attempt to self-correct
            report["summary"] = f"SELF-CORRECTION: {analysis_result['feedback']}. " + report.get("summary", "")
            report["status"] = "REJECTED" # Force rejection if self-analysis fails

            # Re-analyze after correction
            second_analysis = analysis_module.analyze_output([report])
            if not second_analysis["is_valid"]:
                logger.error(f"Self-correction for task {task_id} failed. Reporting task as failed.")
                raise ArtifactError(f"Failed to generate a valid review report after self-correction. Final feedback: {second_analysis['feedback']}")

        final_artifacts = [report]

        # 3. Notify the manager of successful completion
        status = "completed"

    except Exception as e:
        logger.error(f"An error occurred during code review task processing for task {task_id}.", exc_info=True)
        status = "failed"
        final_artifacts = [{"type": "error_report", "details": f"An unexpected error occurred: {str(e)}"}]

    # 4. Send final notification to the agent manager
    completion_message = {
        "task_id": task_id,
        "project_name": project_name,
        "status": status,
        "agent": "code_reviewer",
        "artifacts": final_artifacts
    }

    message = RabbitMQClient.create_message(
        source_agent="code_reviewer",
        target_agent="agent_manager",
        task_type="task_completion_notification",
        payload=completion_message
    )
    rabbitmq_client.publish_message("manager_notifications", message)
    logger.info(f"Successfully processed and reported status '{status}' for code review task {task_id}.")
