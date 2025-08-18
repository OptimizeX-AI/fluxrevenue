from pydantic import BaseModel
from typing import List, Dict, Any
from ..clients.service_clients import (
    project_service_client,
    agent_registry_client,
    metrics_service_client,
)

class SystemOverview(BaseModel):
    active_projects: int
    agent_status: Dict[str, str]
    system_metrics: Dict[str, Any]
    recent_activities: List[str]

class ProjectTimeline(BaseModel):
    project_id: str
    timeline: List[Dict[str, Any]]


class DashboardManager:
    def __init__(self):
        self.project_service = project_service_client
        self.agent_service = agent_registry_client
        self.metrics_service = metrics_service_client

    async def get_system_overview(self) -> SystemOverview:
        """
        Returns a system overview by fetching data from various microservices.
        """
        active_projects = await self.project_service.count_active()
        agent_status = await self.agent_service.get_all_status()
        system_metrics = await self.metrics_service.get_system_metrics()

        # Recent activities would likely come from an event store or a dedicated service.
        # For now, we'll keep this part mocked.
        recent_activities = [
            "Project 'Odyssey' was successfully deployed to production.",
            "High CPU load detected on 'developer_agent'.",
            "New security vulnerability patched in 'auth_service'.",
        ]

        return SystemOverview(
            active_projects=active_projects,
            agent_status=agent_status,
            system_metrics=system_metrics,
            recent_activities=recent_activities,
        )

    async def get_project_timeline(self, project_id: str) -> ProjectTimeline:
        """
        Returns the timeline for a specific project by fetching it from the project service.
        """
        timeline_data = await self.project_service.get_timeline(project_id)
        return ProjectTimeline(**timeline_data)
