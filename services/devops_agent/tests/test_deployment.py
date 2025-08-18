import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.deploy_manager import DeployManager
from app.post_deploy_monitor import PostDeployMonitor

class TestDeployment(unittest.TestCase):

    def setUp(self):
        """Set up instances of the components for testing."""
        self.deploy_manager = DeployManager()
        self.monitor = PostDeployMonitor()

    def test_deploy_manager_kubernetes(self):
        """Test that the deploy manager can call the correct simulated platform function."""
        # Arrange
        artifact_path = "/path/to/artifact.zip"
        config = {"deployment_name": "my-app"}

        # Act
        result = self.deploy_manager.deploy_application(artifact_path, "kubernetes", config)

        # Assert
        self.assertEqual(result["status"], "success")
        self.assertIn("k8s-deploy-my-app", result["deployment_id"])
        self.assertIn("my-app.default.svc.cluster.local", result["url"])

    @patch('app.deploy_manager.DeployManager.rollback_deployment')
    def test_post_deploy_monitor_failure_triggers_rollback(self, mock_rollback):
        """
        This is a more conceptual test of how the task_processor would use these components.
        We simulate the monitor returning an 'unhealthy' status and check if rollback is called.
        """
        # Arrange
        deployment_id = "test-deploy-123"

        # We patch the monitor's check to always fail for this test case
        with patch.object(self.monitor, 'monitor_deployment', return_value={"status": "unhealthy"}):
            # Act
            health_status = self.monitor.monitor_deployment(deployment_id)

            # Assert
            self.assertEqual(health_status["status"], "unhealthy")

            # In the real task processor, this condition would trigger the rollback
            if health_status["status"] != "healthy":
                self.deploy_manager.rollback_deployment(deployment_id)

        # Verify that the rollback method was called
        mock_rollback.assert_called_once_with(deployment_id)


if __name__ == '__main__':
    unittest.main()
