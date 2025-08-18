import json
import logging
import os

# Import the new real deployment components
from .deploy_manager import RealDeployManager
from .post_deploy_monitor import PostDeployMonitor

from .core.exceptions import TaskValidationError, ArtifactError
from message_broker.rabbitmq_client import RabbitMQClient

logger = logging.getLogger(__name__)

def _find_build_artifact_path(artifacts: list) -> str:
    """Finds the path to the build artifact to be deployed."""
    for artifact in artifacts:
        if isinstance(artifact, dict) and artifact.get("type") == "build_artifact":
            return artifact.get("path")
    return None

def process_devops_task(task_data: dict, rabbitmq_client: RabbitMQClient):
    """
    Processes a DevOps task, such as deploying an application using real deployers.
    """
    task_id = task_data.get('task_id')
    project_name = task_data.get('project_name')
    context_artifacts = task_data.get('context_artifacts', [])
    action = task_data.get('action', 'deploy')

    if not all([task_id, project_name]):
        raise TaskValidationError("Task data is missing required fields.", details=task_data)

    logger.info(f"Processing DevOps task '{action}' for task {task_id} using RealDeployManager.")

    deploy_manager = RealDeployManager()
    monitor = PostDeployMonitor()

    final_artifacts = []
    status = "completed"

    try:
        if action == "deploy":
            build_artifact_path = _find_build_artifact_path(context_artifacts)
            if not build_artifact_path:
                raise ArtifactError("No build artifact found to deploy.")

            # For this PoC, we default to Kubernetes. A real task would specify the platform.
            platform = "kubernetes"
            deploy_config = {
                "namespace": "production",
                "manifest_path": os.path.join(os.path.dirname(__file__), 'deployment.yml'),
                # In a real scenario, we'd pass the image tag from the build artifact
                "image_tag": f"{project_name.lower()}:latest"
            }

            deploy_result = deploy_manager.deploy_application(platform, deploy_config)

            deployment_id = deploy_result.get("deployment_name")
            health_status = monitor.monitor_deployment(deployment_id)

            if health_status.get("status") != "healthy":
                logger.error(f"Post-deployment check failed for {deployment_id}. Initiating rollback.")
                deploy_manager.rollback_deployment(platform, deployment_id)
                raise Exception(f"Deployment failed post-deploy checks: {health_status.get('reason')}")

            final_artifacts.append({"type": "deployment_receipt", **deploy_result})
            logger.info(f"Successfully deployed and monitored {deployment_id}.")
        else:
            raise NotImplementedError(f"DevOps action '{action}' is not supported.")

    except Exception as e:
        logger.error(f"An error occurred during DevOps task processing for task {task_id}.", exc_info=True)
        status = "failed"
        final_artifacts = [{"type": "error_report", "details": str(e)}]

    # Send final notification to the orchestrator
    completion_message = {
        "task_id": task_id,
        "project_id": project_name,
        "status": status,
        "agent": "devops_agent",
        "artifacts": final_artifacts
    }

    reply_to_queue = task_data.get('reply_to_queue', 'orchestrator_notifications')
    message = RabbitMQClient.create_message(
        source_agent="devops_agent",
        target_agent="project_orchestrator",
        task_type="task_completion_notification",
        payload=completion_message
    )
    rabbitmq_client.publish_message(reply_to_queue, message)
    logger.info(f"Reported status '{status}' for DevOps task {task_id}.")
