import pytest
from ..agent import InfraAutomationAgent

@pytest.fixture
def agent():
    """Provides an InfraAutomationAgent instance for tests."""
    return InfraAutomationAgent(agent_id="test_ia_01")

@pytest.mark.asyncio
async def test_process_provision_infrastructure_task(agent):
    """Tests the agent's ability to handle 'provision_infrastructure' tasks."""
    task = {
        "type": "provision_infrastructure",
        "data": {
            "terraform_plan": {"resource_type": "database"}
        }
    }
    result = await agent.process_task(task)

    assert result["status"] == "completed"
    assert "terraform_output" in result["result"]
    assert "Provisioning successful" in result["result"]["terraform_output"]

@pytest.mark.asyncio
async def test_process_configure_servers_task(agent):
    """Tests the agent's ability to handle 'configure_servers' tasks."""
    task = {
        "type": "configure_servers",
        "data": {
            "ansible_playbook": "webserver_setup.yml"
        }
    }
    result = await agent.process_task(task)

    assert result["status"] == "completed"
    assert "ansible_output" in result["result"]
    assert "Configuration applied successfully" in result["result"]["ansible_output"]
