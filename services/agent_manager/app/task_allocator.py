import logging
import httpx
import os
from typing import Dict, List, Optional
import pybreaker

# Import the shared resilience components
from services.common.resilience import resilient_call, breaker

logger = logging.getLogger(__name__)

class TaskAllocator:
    """
    Allocates tasks to the most suitable agent based on capabilities and status.
    Uses resilience patterns for communication with the Agent Registry.
    """
    def __init__(self):
        self.agent_registry_url = os.getenv("AGENT_REGISTRY_URL", "http://agent_registry:8010")
        self.http_client = httpx.Client(timeout=5.0) # Add a 5-second timeout
        logger.info("TaskAllocator initialized with resilience patterns.")

    @resilient_call  # Apply the tenacity retry decorator
    @breaker        # Apply the pybreaker circuit breaker decorator
    def _get_available_agents_from_registry(self) -> List[Dict]:
        """
        Internal method to fetch agents from the registry.
        This method is decorated for resilience.
        """
        response = self.http_client.get(f"{self.agent_registry_url}/agents")
        response.raise_for_status() # Will raise an exception on 4xx/5xx responses
        return response.json()

    def _get_available_agents(self) -> List[Dict]:
        """
        Retrieves the list of active and non-overloaded agents from the Agent Registry.
        This function handles exceptions from the resilient call.
        """
        try:
            agents = self._get_available_agents_from_registry()
            # Filter for agents that are 'active' (not 'inactive', 'busy', or 'overloaded')
            available_agents = [agent for agent in agents if agent.get("status") == "active"]
            return available_agents
        except pybreaker.CircuitBreakerError as e:
            logger.error(f"Circuit breaker is open. Could not connect to Agent Registry: {e}")
            return []
        except Exception as e:
            logger.error(f"Failed to get available agents from registry after retries: {e}")
            return []

    def select_agent(self, task: Dict) -> Optional[str]:
        """
        Selects the best agent for a given task.
        """
        available_agents = self._get_available_agents()
        if not available_agents:
            logger.error("No active agents available for task allocation.")
            return None

        required_capabilities = task.get("required_capabilities", [])

        candidate_agents = []
        for agent in available_agents:
            agent_capabilities = set(agent.get("capabilities", []))
            if set(required_capabilities).issubset(agent_capabilities):
                candidate_agents.append(agent)

        if not candidate_agents:
            logger.warning(f"No agent found with all required capabilities: {required_capabilities}")
            return None

        # A more advanced strategy could be implemented here, e.g., random choice for load balancing
        selected_agent = candidate_agents[0]
        logger.info(f"Selected agent '{selected_agent['name']}' for task '{task.get('description', '')[:50]}...'.")

        return selected_agent["name"]
