import pytest
from ..agent import SupportSpecialistAgent

@pytest.fixture
def agent():
    """Provides a SupportSpecialistAgent instance for tests."""
    return SupportSpecialistAgent(agent_id="test_ss_01")

@pytest.mark.asyncio
async def test_process_troubleshoot_issue_task(agent):
    """Tests the agent's ability to handle 'troubleshoot_issue' tasks."""
    task = {
        "type": "troubleshoot_issue",
        "data": {
            "description": "The database connection is failing."
        }
    }
    result = await agent.process_task(task)

    assert result["status"] == "completed"
    assert "diagnosis" in result["result"]
    assert "DB connection error" in result["result"]["diagnosis"]["probable_cause"]

@pytest.mark.asyncio
async def test_process_answer_question_task(agent):
    """Tests the agent's ability to handle 'answer_question' tasks."""
    task = {
        "type": "answer_question",
        "data": {
            "question": "how to reset my password"
        }
    }
    result = await agent.process_task(task)

    assert result["status"] == "completed"
    assert "answer" in result["result"]
    assert "KB-123" in result["result"]["answer"]
