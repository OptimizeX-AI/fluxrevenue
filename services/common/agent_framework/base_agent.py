import asyncio
import os
import importlib.util
from typing import List, Dict, Any, Optional

# ==============================================================================
# --- Mock Clients for Demonstration ---
# In a real system, these would be proper client implementations.
# ==============================================================================

class MockRabbitMQClient:
    async def consume_messages(self, queue_name, callback):
        print(f"[MockRabbitMQ] Started consumer for queue: {queue_name}")

class MockAgentRegistryClient:
    async def register_agent(self, agent_info: Dict[str, Any]):
        print(f"[MockAgentRegistry] Registered agent: {agent_info.get('agent_id')}")
        return True

class MockMemoryAgentClient:
    async def store_memory(self, agent_id: str, memory_data: Dict[str, Any]):
        print(f"[MockMemoryAgent] Stored memory for {agent_id}.")
        return True

# ==============================================================================
# --- Plugin System ---
# ==============================================================================

class Plugin:
    """Base class for all plugins."""
    def get_capabilities(self) -> List[str]:
        raise NotImplementedError

class PluginSystem:
    """A system for dynamically loading plugins to extend agent capabilities."""
    def __init__(self, plugin_directory: str = "/plugins"):
        self.plugins: Dict[str, Plugin] = {}
        self.plugin_directory = plugin_directory
        if not os.path.exists(self.plugin_directory):
            print(f"Plugin directory {self.plugin_directory} not found. Creating it.")
            os.makedirs(self.plugin_directory)

    async def load_plugin(self, plugin_name: str) -> Optional[Plugin]:
        """Loads a plugin dynamically from the plugin directory."""
        plugin_path = os.path.join(self.plugin_directory, plugin_name)
        spec_path = os.path.join(plugin_path, "plugin.py")
        if not os.path.exists(spec_path):
            print(f"Plugin {plugin_name} not found at {spec_path}")
            return None

        spec = importlib.util.spec_from_file_location(plugin_name, spec_path)
        plugin_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(plugin_module)

        plugin_class_name = f"{plugin_name.replace('_', ' ').title().replace(' ', '')}Plugin"
        plugin_class = getattr(plugin_module, plugin_class_name)

        plugin_instance = plugin_class()
        self.plugins[plugin_name] = plugin_instance
        print(f"Successfully loaded plugin: {plugin_name}")
        return plugin_instance

# ==============================================================================
# --- Base Agent Class ---
# ==============================================================================

class BaseAgent:
    """An abstract base class for all specialized agents."""
    def __init__(self, agent_id: str, domain: str):
        if not agent_id or not domain:
            raise ValueError("agent_id and domain must be provided.")
        self.agent_id = agent_id
        self.domain = domain
        self.capabilities: List[str] = []
        self.message_client = MockRabbitMQClient()
        self.registry_client = MockAgentRegistryClient()
        self.memory_client = MockMemoryAgentClient()
        self.task_queue_name = f"{self.domain}_tasks"

    async def initialize(self):
        """Initializes the agent."""
        await self._register_capabilities()
        await self._start_listening()
        print(f"Agent {self.agent_id} initialized for domain '{self.domain}'.")

    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Processes a task specific to the agent's domain."""
        raise NotImplementedError("This method must be implemented by subclasses.")

    async def _handle_message(self, message: Dict[str, Any]):
        """Callback to handle incoming messages."""
        task_result = await self.process_task(message)
        await self.memory_client.store_memory(self.agent_id, {"task_result": task_result})

    async def _register_capabilities(self):
        """Registers agent capabilities."""
        agent_info = {"agent_id": self.agent_id, "domain": self.domain, "capabilities": self.capabilities, "status": "active"}
        await self.registry_client.register_agent(agent_info)

    async def _start_listening(self):
        """Starts listening for tasks."""
        await self.message_client.consume_messages(self.task_queue_name, self._handle_message)

# ==============================================================================
# --- Placeholder Agent Implementations (for Factory) ---
# ==============================================================================

# --- Import real agent implementations ---
from ....services.data_analyst_agent.agent import DataAnalystAgent
from ....services.infra_automation_agent.agent import InfraAutomationAgent
from ....services.support_specialist_agent.agent import SupportSpecialistAgent

# ==============================================================================
# --- Agent Factory ---
# ==============================================================================

class AgentFactory:
    """A factory for creating specialized agent instances."""
    def __init__(self):
        self.agent_templates: Dict[str, type[BaseAgent]] = {
            "data_analyst": DataAnalystAgent,
            "infrastructure_automation": InfraAutomationAgent,
            "support_specialist": SupportSpecialistAgent,
        }

    async def create_agent(self, agent_type: str, agent_id: str, **kwargs: Any) -> BaseAgent:
        """Creates and initializes a specific agent instance."""
        agent_class = self.agent_templates.get(agent_type)
        if not agent_class:
            raise ValueError(f"Unknown agent type: {agent_type}")
        agent = agent_class(agent_id=agent_id, **kwargs)
        await agent.initialize()
        return agent
