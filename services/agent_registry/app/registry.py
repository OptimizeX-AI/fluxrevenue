import redis
import json
from datetime import datetime
from typing import Dict, Optional, List
from .models import AgentMetadata, AgentRegistration

class AgentRegistry:
    """
    Manages the registration and lifecycle of agents using Redis as a backend.
    """
    def __init__(self, redis_host: str, redis_port: int):
        self.redis_client = redis.Redis(host=redis_host, port=redis_port, db=0, decode_responses=True)
        self.agent_key_prefix = "agent:"

    def _get_agent_key(self, agent_name: str) -> str:
        return f"{self.agent_key_prefix}{agent_name}"

    def register_agent(self, registration_data: AgentRegistration) -> AgentMetadata:
        """
        Registers a new agent or updates an existing one.
        """
        agent_name = registration_data.name
        agent_key = self._get_agent_key(agent_name)

        now = datetime.utcnow()

        agent_data = AgentMetadata(
            name=agent_name,
            version=registration_data.version,
            capabilities=registration_data.capabilities,
            supported_languages=registration_data.supported_languages,
            status="active",
            last_heartbeat=now
        )

        self.redis_client.set(agent_key, agent_data.model_dump_json())
        return agent_data

    def update_heartbeat(self, agent_name: str) -> Optional[AgentMetadata]:
        """
        Updates the heartbeat for a given agent, marking it as active.
        """
        agent_key = self._get_agent_key(agent_name)
        agent_json = self.redis_client.get(agent_key)

        if not agent_json:
            return None # Agent not registered

        agent_data = AgentMetadata.model_validate_json(agent_json)
        agent_data.last_heartbeat = datetime.utcnow()
        agent_data.status = "active"

        self.redis_client.set(agent_key, agent_data.model_dump_json())
        return agent_data

    def get_agent(self, agent_name: str) -> Optional[AgentMetadata]:
        """
        Retrieves the metadata for a specific agent.
        """
        agent_key = self._get_agent_key(agent_name)
        agent_json = self.redis_client.get(agent_key)

        if not agent_json:
            return None

        return AgentMetadata.model_validate_json(agent_json)

    def list_agents(self) -> List[AgentMetadata]:
        """
        Lists all registered agents.
        """
        agent_keys = self.redis_client.keys(f"{self.agent_key_prefix}*")
        if not agent_keys:
            return []

        agents_json = self.redis_client.mget(agent_keys)
        return [AgentMetadata.model_validate_json(agent_json) for agent_json in agents_json if agent_json]

    def set_agent_status(self, agent_name: str, status: str) -> Optional[AgentMetadata]:
        """
        Sets the status of an agent (e.g., 'inactive', 'busy').
        """
        agent_key = self._get_agent_key(agent_name)
        agent_json = self.redis_client.get(agent_key)

        if not agent_json:
            return None

        agent_data = AgentMetadata.model_validate_json(agent_json)
        agent_data.status = status

        self.redis_client.set(agent_key, agent_data.model_dump_json())
        return agent_data
