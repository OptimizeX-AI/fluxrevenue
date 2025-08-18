import unittest
from unittest.mock import patch, MagicMock
import os
import sys
import yaml

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.deploy_manager import RealDeployManager

# We patch the kubernetes client to avoid needing a real cluster for tests
@patch('app.kubernetes_deployer.client', MagicMock())
@patch('app.kubernetes_deployer.config', MagicMock())
class TestRealDeployment(unittest.TestCase):

    def setUp(self):
        """Set up a new RealDeployManager for each test."""
        self.deploy_manager = RealDeployManager()

        # Create a dummy manifest file for testing
        self.manifest_path = "test_manifest.yml"
        self.manifest_content = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {"name": "test-app"}
        }
        with open(self.manifest_path, 'w') as f:
            yaml.dump(self.manifest_content, f)

    def tearDown(self):
        """Clean up the dummy manifest file."""
        if os.path.exists(self.manifest_path):
            os.remove(self.manifest_path)

    def test_deploy_to_kubernetes(self):
        """
        Test that the RealDeployManager correctly calls the kubernetes client
        to apply a manifest.
        """
        # Arrange
        # The mock for the k8s client is already set up by the class decorator
        from app.kubernetes_deployer import client as k8s_client

        # We need to mock the return value of the API call
        mock_api = self.deploy_manager.platforms["kubernetes"].apps_v1
        mock_api.create_namespaced_deployment.return_value = MagicMock(
            metadata=MagicMock(name="test-app-deployment")
        )
        # Make the read call raise a 404 to trigger the create path
        mock_api.read_namespaced_deployment.side_effect = k8s_client.ApiException(status=404)

        config = {"manifest_path": self.manifest_path, "namespace": "test-ns"}

        # Act
        result = self.deploy_manager.deploy_application("kubernetes", config)

        # Assert
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["deployment_name"], "test-app-deployment")
        # Verify that create_namespaced_deployment was called with the correct manifest and namespace
        mock_api.create_namespaced_deployment.assert_called_once_with(
            body=self.manifest_content,
            namespace="test-ns"
        )


if __name__ == '__main__':
    unittest.main()
