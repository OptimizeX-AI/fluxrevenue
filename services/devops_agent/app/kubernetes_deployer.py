import logging
from typing import List, Dict, Any
from kubernetes import client, config

logger = logging.getLogger(__name__)

class KubernetesDeployer:
    """
    Handles the deployment of applications to a Kubernetes cluster.
    """
    def __init__(self):
        self._load_config()
        self.apps_v1 = client.AppsV1Api()
        logger.info("KubernetesDeployer initialized.")

    def _load_config(self):
        """
        Loads Kubernetes configuration. It tries in-cluster config first,
        then falls back to the default kubeconfig file (~/.kube/config).
        """
        try:
            config.load_incluster_config()
            logger.info("Loaded in-cluster Kubernetes configuration.")
        except config.ConfigException:
            try:
                config.load_kube_config()
                logger.info("Loaded Kubernetes configuration from kubeconfig file.")
            except config.ConfigException as e:
                logger.warning(f"Could not load any Kubernetes configuration. Deployments will fail: {e}")
                # We don't raise an exception here, so the agent can start.
                # The methods below will fail gracefully if no config is loaded.
                self.apps_v1 = None

    def apply_manifest(self, manifest: Dict[str, Any], namespace: str = "default") -> Dict:
        """
        Applies a single Kubernetes manifest (e.g., a Deployment).
        This is a simplified version that only handles Deployments.
        """
        if not self.apps_v1:
            raise ConnectionError("Kubernetes client is not configured.")

        api_version = manifest.get("apiVersion")
        kind = manifest.get("kind")

        if api_version == "apps/v1" and kind == "Deployment":
            deployment_name = manifest["metadata"]["name"]
            try:
                # Check if the deployment already exists
                self.apps_v1.read_namespaced_deployment(name=deployment_name, namespace=namespace)
                logger.info(f"Deployment '{deployment_name}' already exists. Patching it.")
                api_response = self.apps_v1.patch_namespaced_deployment(
                    name=deployment_name,
                    namespace=namespace,
                    body=manifest
                )
            except client.ApiException as e:
                if e.status == 404:
                    logger.info(f"Deployment '{deployment_name}' does not exist. Creating it.")
                    api_response = self.apps_v1.create_namespaced_deployment(
                        body=manifest,
                        namespace=namespace
                    )
                else:
                    raise

            return {"status": "success", "deployment_name": api_response.metadata.name}
        else:
            raise NotImplementedError(f"Manifest kind '{kind}' with apiVersion '{api_version}' is not supported.")

    def rollback_deployment(self, deployment_name: str, namespace: str = "default") -> bool:
        """
        Initiates a rollback for a given deployment.
        """
        if not self.apps_v1:
            raise ConnectionError("Kubernetes client is not configured.")

        logger.warning(f"Initiating rollback for deployment '{deployment_name}' in namespace '{namespace}'.")
        try:
            # This is a simplified rollback. A real one would need more logic
            # to handle revision history.
            body = {"spec": {"strategy": {"rollingUpdate": None, "type": "Recreate"}}} # A simple way to trigger a rollout
            self.apps_v1.patch_namespaced_deployment(name=deployment_name, namespace=namespace, body=body)
            return True
        except client.ApiException as e:
            logger.error(f"Failed to rollback deployment '{deployment_name}': {e}")
            return False
