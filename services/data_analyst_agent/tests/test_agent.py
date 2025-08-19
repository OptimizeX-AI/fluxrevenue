import pytest
from ..agent import DataAnalystAgent

@pytest.fixture
def agent():
    """Provides a DataAnalystAgent instance for tests."""
    return DataAnalystAgent(agent_id="test_da_01")

@pytest.mark.asyncio
async def test_process_analyze_dataset_task(agent):
    """Tests the agent's ability to handle 'analyze_dataset' tasks."""
    task = {
        "type": "analyze_dataset",
        "data": {
            "dataset": [
                {"id": 1, "value": 10},
                {"id": 2, "value": 20},
                {"id": 3, "value": 60},
            ]
        }
    }
    result = await agent.process_task(task)

    assert result["status"] == "completed"
    assert "statistics" in result["result"]
    assert "insights" in result["result"]
    assert result["result"]["statistics"]["mean_value"] == 30.0

@pytest.mark.asyncio
async def test_process_create_visualization_task(agent):
    """Tests the agent's ability to handle 'create_visualization' tasks."""
    task = {
        "type": "create_visualization",
        "data": {
            "dataset": [{"category": "A", "value": 10}],
            "chart_type": "pie_chart"
        }
    }
    result = await agent.process_task(task)

    assert result["status"] == "completed"
    assert "chart_url" in result["result"]
    assert "pie_chart" in result["result"]["chart_url"]

@pytest.mark.asyncio
async def test_process_unsupported_task(agent):
    """Tests that the agent returns an error for an unsupported task type."""
    task = {"type": "unsupported_task"}
    result = await agent.process_task(task)

    assert result["status"] == "completed" # The task processing is complete
    assert "error" in result["result"]
    assert "Unsupported task type" in result["result"]["error"]
