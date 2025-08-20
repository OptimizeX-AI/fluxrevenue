import pytest
from unittest.mock import patch
from ..app.task_allocator import TaskAllocator

@pytest.fixture
def allocator():
    """Provides a TaskAllocator instance for testing."""
    return TaskAllocator()

def test_select_agent_with_matching_capabilities(allocator):
    """
    Tests that an agent is selected when its capabilities match the task requirements.
    """
    mock_agents = [
        {"name": "developer_agent_1", "capabilities": ["python", "fastapi"], "status": "active"},
        {"name": "developer_agent_2", "capabilities": ["javascript", "react"], "status": "active"}
    ]
    task = {"required_capabilities": ["python", "fastapi"]}

    # We mock _get_available_agents to isolate the selection logic.
    with patch.object(allocator, '_get_available_agents', return_value=mock_agents) as mock_method:
        selected_agent = allocator.select_agent(task)
        assert selected_agent == "developer_agent_1"
        mock_method.assert_called_once()

def test_select_agent_no_matching_capabilities(allocator):
    """
    Tests that no agent is selected if none have the required capabilities.
    """
    mock_agents = [
        {"name": "developer_agent_1", "capabilities": ["python", "fastapi"], "status": "active"},
    ]
    task = {"required_capabilities": ["javascript"]}

    with patch.object(allocator, '_get_available_agents', return_value=mock_agents):
        selected_agent = allocator.select_agent(task)
        assert selected_agent is None

def test_select_agent_no_available_agents(allocator):
    """
    Tests that no agent is selected if the registry returns no available agents.
    """
    task = {"required_capabilities": ["python"]}

    with patch.object(allocator, '_get_available_agents', return_value=[]):
        selected_agent = allocator.select_agent(task)
        assert selected_agent is None

def test_get_available_agents_filters_by_status(allocator):
    """
    Tests that the internal _get_available_agents method correctly filters agents by 'active' status.
    This requires mocking the underlying resilient call to the registry.
    """
    mock_registry_response = [
        {"name": "agent_1", "status": "active"},
        {"name": "agent_2", "status": "busy"},
        {"name": "agent_3", "status": "active"},
        {"name": "agent_4", "status": "inactive"},
    ]

    with patch.object(allocator, '_get_available_agents_from_registry', return_value=mock_registry_response):
        available_agents = allocator._get_available_agents()
        assert len(available_agents) == 2
        assert available_agents[0]['name'] == 'agent_1'
        assert available_agents[1]['name'] == 'agent_3'
