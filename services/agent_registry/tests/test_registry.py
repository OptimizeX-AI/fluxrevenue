import unittest
import os
import sys
from datetime import datetime, timedelta

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.registry import AgentRegistry
from app.models import AgentRegistration

class TestAgentRegistry(unittest.TestCase):

    def setUp(self):
        """Set up a new AgentRegistry instance and clear Redis before each test."""
        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = int(os.getenv("REDIS_PORT", 6379))
        self.registry = AgentRegistry(redis_host=self.redis_host, redis_port=self.redis_port)
        # Clear all agent keys from Redis to ensure a clean slate
        keys = self.registry.redis_client.keys(f"{self.registry.agent_key_prefix}*")
        if keys:
            self.registry.redis_client.delete(*keys)

    def test_register_agent(self):
        """Test that a new agent can be registered successfully."""
        # Arrange
        registration_data = AgentRegistration(
            name="test_agent_1",
            version="1.0.1",
            capabilities=["testing"],
            supported_languages=["python"]
        )

        # Act
        registered_agent = self.registry.register_agent(registration_data)

        # Assert
        self.assertEqual(registered_agent.name, "test_agent_1")
        self.assertEqual(registered_agent.status, "active")
        self.assertIsNotNone(registered_agent.last_heartbeat)

        # Verify it was stored in Redis correctly
        retrieved_agent = self.registry.get_agent("test_agent_1")
        self.assertIsNotNone(retrieved_agent)
        self.assertEqual(retrieved_agent.version, "1.0.1")

    def test_list_agents(self):
        """Test that all registered agents can be listed."""
        # Arrange
        self.registry.register_agent(AgentRegistration(name="test_agent_2", version="1.0", capabilities=[], supported_languages=[]))
        self.registry.register_agent(AgentRegistration(name="test_agent_3", version="1.0", capabilities=[], supported_languages=[]))

        # Act
        agents = self.registry.list_agents()

        # Assert
        self.assertEqual(len(agents), 2)
        agent_names = {agent.name for agent in agents}
        self.assertIn("test_agent_2", agent_names)
        self.assertIn("test_agent_3", agent_names)

    def test_update_heartbeat(self):
        """Test that an agent's heartbeat can be updated."""
        # Arrange
        self.registry.register_agent(AgentRegistration(name="heartbeat_agent", version="1.0", capabilities=[], supported_languages=[]))
        initial_agent = self.registry.get_agent("heartbeat_agent")
        initial_heartbeat = initial_agent.last_heartbeat

        # Act
        import time
        time.sleep(1) # Ensure the timestamp will be different
        self.registry.update_heartbeat("heartbeat_agent")
        updated_agent = self.registry.get_agent("heartbeat_agent")

        # Assert
        self.assertIsNotNone(updated_agent)
        self.assertGreater(updated_agent.last_heartbeat, initial_heartbeat)

    def test_set_agent_status(self):
        """Test that an agent's status can be manually set."""
        # Arrange
        self.registry.register_agent(AgentRegistration(name="status_agent", version="1.0", capabilities=[], supported_languages=[]))

        # Act
        self.registry.set_agent_status("status_agent", "busy")

        # Assert
        updated_agent = self.registry.get_agent("status_agent")
        self.assertEqual(updated_agent.status, "busy")

if __name__ == '__main__':
    unittest.main()
