import json
import logging
import os

# Import the new security components
from .vulnerability_scanner import VulnerabilityScanner
from .sast_analyzer import SASTAnalyzer
from .compliance_checker import ComplianceChecker

from .core.exceptions import TaskValidationError, ArtifactError
from message_broker.rabbitmq_client import RabbitMQClient

logger = logging.getLogger(__name__)

def _find_source_code_artifacts(artifacts: list) -> list:
    """Finds all source code artifacts in a list."""
    source_artifacts = []
    for artifact in artifacts:
        if isinstance(artifact, dict) and artifact.get("type") == "source_code":
            # We need content, not just path
            if "content" in artifact and "path" in artifact:
                 source_artifacts.append(artifact)
    logger.info(f"Found {len(source_artifacts)} source code artifacts to scan.")
    return source_artifacts

def process_security_task(task_data: dict, rabbitmq_client: RabbitMQClient):
    """
    Processes a security task by running a suite of scanners on source code artifacts.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    context_artifacts = task_data.get('context_artifacts', [])

    if not all([task_id, project_name]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info(f"Processing security analysis task {task_id} with advanced scanners.")

    # --- Initialize Scanners ---
    vuln_scanner = VulnerabilityScanner()
    sast_analyzer = SASTAnalyzer()
    compliance_checker = ComplianceChecker()

    all_issues = []
    status = "completed"

    try:
        source_artifacts = _find_source_code_artifacts(context_artifacts)
        if not source_artifacts:
            raise ArtifactError("No valid source code artifacts with content found to scan.")

        for artifact in source_artifacts:
            filename = artifact.get("path")
            content = artifact.get("content")

            all_issues.extend(vuln_scanner.scan_for_hardcoded_secrets(content, filename))
            all_issues.extend(sast_analyzer.analyze_source_code(content, filename))
            all_issues.extend(compliance_checker.check_for_compliance_issues(content, filename))

        # Determine overall status based on findings
        if any(issue['severity'] == 'High' or issue['severity'] == 'Critical' for issue in all_issues):
            final_status = "REJECTED"
        else:
            final_status = "APPROVED"

        # Assemble the final report artifact
        final_report = {
            "status": final_status,
            "summary": f"Security scan completed. Found {len(all_issues)} total issues.",
            "issues": all_issues
        }
        final_artifacts = [final_report]

        logger.info(f"Successfully generated security report for task {task_id}. Final status: {final_status}")

    except Exception as e:
        logger.error(f"An error occurred during security task processing for task {task_id}.", exc_info=True)
        status = "failed"
        final_artifacts = [{"type": "error_report", "details": f"An unexpected error occurred: {str(e)}"}]

    # Send final notification to the agent manager
    completion_message = {
        "task_id": task_id,
        "project_name": project_name,
        "status": status,
        "agent": "security_agent",
        "artifacts": final_artifacts
    }

    message = RabbitMQClient.create_message(
        source_agent="security_agent",
        target_agent="agent_manager",
        task_type="task_completion_notification",
        payload=completion_message
    )
    rabbitmq_client.publish_message("manager_notifications", message)
    logger.info(f"Reported status '{status}' for security task {task_id}.")
