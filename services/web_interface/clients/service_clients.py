import httpx
from typing import Dict, Any, List
import os

# In a real-world scenario, these URLs would come from a config management system
AGENT_REGISTRY_URL = os.getenv("AGENT_REGISTRY_URL", "http://agent_registry:8010")
PROJECT_ORCHESTRATOR_URL = os.getenv("PROJECT_ORCHESTRATOR_URL", "http://project_orchestrator:8011")
# Metrics might be scraped from an endpoint or a dedicated service
METRICS_URL = os.getenv("METRICS_URL", "http://prometheus:9090")


class BaseServiceClient:
    def __init__(self, base_url: str):
        self.client = httpx.AsyncClient(base_url=base_url)

    async def close(self):
        await self.client.aclose()


class ProjectServiceClient(BaseServiceClient):
    async def count_active(self) -> int:
        # MOCK IMPLEMENTATION
        # In a real implementation, you would make an API call like this:
        # response = await self.client.get("/projects/status/active/count")
        # response.raise_for_status()
        # return response.json()["count"]
        return 12  # Returning mock data

    async def get_timeline(self, project_id: str) -> Dict[str, Any]:
        # MOCK IMPLEMENTATION
        return {
            "project_id": project_id,
            "timeline": [
                {"timestamp": "2023-10-27T10:00:00Z", "event": f"Project {project_id} initialized"},
                {"timestamp": "2023-10-27T10:05:00Z", "event": "Agent assigned via API call"},
            ],
        }


class AgentRegistryClient(BaseServiceClient):
    async def get_all_status(self) -> Dict[str, str]:
        # MOCK IMPLEMENTATION
        return {
            "developer_agent": "active",
            "qa_agent": "idle",
            "code_reviewer": "active",
            "security_agent": "scanning",
        }


class MetricsServiceClient(BaseServiceClient):
    async def get_system_metrics(self) -> Dict[str, Any]:
        # MOCK IMPLEMENTATION
        # This would typically query a time-series database like Prometheus.
        return {
            "cpu_load": "75%",
            "memory_usage": "62%",
            "active_connections": 142,
        }

# Instantiate clients for use in the application
project_service_client = ProjectServiceClient(base_url=PROJECT_ORCHESTRATOR_URL)
agent_registry_client = AgentRegistryClient(base_url=AGENT_REGISTRY_URL)
metrics_service_client = MetricsServiceClient(base_url=METRICS_URL)
