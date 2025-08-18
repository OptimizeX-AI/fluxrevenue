import pytest
from unittest.mock import patch, MagicMock, mock_open
from ..base_agent import AgentFactory, DataAnalystAgent, PluginSystem, Plugin

# --- Tests for AgentFactory ---

@pytest.mark.asyncio
async def test_agent_factory_create_known_agent():
    """Tests that the factory can create a known agent type."""
    factory = AgentFactory()
    agent = await factory.create_agent(agent_type="data_analyst", agent_id="test_da_01")

    assert isinstance(agent, DataAnalystAgent)
    assert agent.agent_id == "test_da_01"
    assert agent.domain == "data_analysis"

@pytest.mark.asyncio
async def test_agent_factory_create_unknown_agent_raises_error():
    """Tests that the factory raises a ValueError for an unknown agent type."""
    factory = AgentFactory()

    with pytest.raises(ValueError, match="Unknown agent type: non_existent_agent"):
        await factory.create_agent(agent_type="non_existent_agent", agent_id="test_01")

# --- Tests for PluginSystem ---

# A mock plugin for testing purposes
mock_plugin_code = """
from ....common.agent_framework.base_agent import Plugin

class TestpluginPlugin(Plugin):
    def get_capabilities(self):
        return ["test_capability_1", "test_capability_2"]
"""

@pytest.fixture
def plugin_system():
    """Fixture to create a PluginSystem instance."""
    # We can point the plugin directory to a temporary or test-specific path
    return PluginSystem(plugin_directory="/tmp/plugins_test")

@pytest.mark.asyncio
@patch('os.path.exists', return_value=True)
@patch('importlib.util.spec_from_file_location')
@patch('importlib.util.module_from_spec')
async def test_plugin_system_load_plugin_success(mock_module_from_spec, mock_spec_from_file, mock_exists):
    """
    Tests the successful dynamic loading of a plugin.
    This test extensively mocks the file system and importlib operations.
    """
    plugin_system = PluginSystem()
    plugin_name = "test_plugin"

    # --- Mocking the dynamic import process ---
    # 1. Mock the spec
    mock_spec = MagicMock()
    mock_spec.loader.exec_module = MagicMock()
    mock_spec_from_file.return_value = mock_spec

    # 2. Mock the module
    mock_module = MagicMock()
    # Create a mock Plugin class within the mock module
    class MockTestPlugin(Plugin):
        def get_capabilities(self):
            return ["mock_capability"]
    mock_module.TestpluginPlugin = MockTestPlugin
    mock_module_from_spec.return_value = mock_module

    # --- Execute and Assert ---
    loaded_plugin = await plugin_system.load_plugin(plugin_name)

    assert loaded_plugin is not None
    assert isinstance(loaded_plugin, MockTestPlugin)
    assert plugin_name in plugin_system.plugins
    mock_exists.assert_called()
    mock_spec_from_file.assert_called_once()
    mock_spec.loader.exec_module.assert_called_once()

@pytest.mark.asyncio
@patch('os.path.exists', return_value=False)
async def test_plugin_system_load_non_existent_plugin(mock_exists, plugin_system):
    """Tests that loading a non-existent plugin returns None without error."""
    plugin_name = "non_existent_plugin"

    loaded_plugin = await plugin_system.load_plugin(plugin_name)

    assert loaded_plugin is None
    assert plugin_name not in plugin_system.plugins
