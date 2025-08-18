import logging
import httpx
import os
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class TaskAllocator:
    """
    Allocates tasks to the most suitable agent based on capabilities and status.
    """
    def __init__(self):
        self.agent_registry_url = os.getenv("AGENT_REGISTRY_URL", "http://agent_registry:8010")
        logger.info("TaskAllocator initialized.")

    def _get_available_agents(self) -> List[Dict]:
        """
        Retrieves the list of active agents from the Agent Registry.
        """
        try:
            # In a real async application, we'd use an async client.
            # For simplicity in this synchronous context, we use the sync client.
            response = httpx.get(f"{self.agent_registry_url}/agents")
            response.raise_for_status()
            agents = response.json()
            # Filter for active agents only
            active_agents = [agent for agent in agents if agent.get("status") == "active"]
            return active_agents
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            logger.error(f"Failed to get available agents from registry: {e}")
            return []

    def select_agent(self, task: Dict) -> Optional[str]:
        """
        Selects the best agent for a given task.

        Args:
            task: A dictionary representing the task. It should contain a 'description'
                  and may contain 'required_capabilities'.

        Returns:
            The name of the selected agent, or None if no suitable agent is found.
        """
        available_agents = self._get_available_agents()
        if not available_agents:
            logger.error("No active agents available for task allocation.")
            return None

        required_capabilities = task.get("required_capabilities", [])

        candidate_agents = []
        for agent in available_agents:
            # Check if the agent has all required capabilities
            agent_capabilities = set(agent.get("capabilities", []))
            if set(required_capabilities).issubset(agent_capabilities):
                candidate_agents.append(agent)

        if not candidate_agents:
            logger.warning(f"No agent found with all required capabilities: {required_capabilities}")
            return None

        # --- Simple Selection Strategy: Choose the first candidate ---
        # A more advanced strategy could consider agent load, success rate, etc.
        # These metrics would need to be added to the Agent Registry first.

        selected_agent = candidate_agents[0] # Simplest strategy
        logger.info(f"Selected agent '{selected_agent['name']}' for task '{task.get('description', '')[:50]}...'.")

        return selected_agent["name"]
