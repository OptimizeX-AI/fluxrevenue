import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from ..app.decision_engine import DecisionEngine
from ..app.priority_manager import PriorityManager
# We will move the app test to test_main.py later. For now, let's fix the imports.
# from services.agent_manager.app.main import app as fastapi_app

@pytest.fixture
def decision_engine():
    """Provides a DecisionEngine instance for testing."""
    return DecisionEngine()

# This test logically belongs with PriorityManager, let's move it to its own test file.
# I will create test_priority_manager.py and put this there.
# For now, I will just test the decision engine itself.

@patch('services.agent_manager.app.task_allocator.TaskAllocator._get_available_agents')
@pytest.mark.asyncio
async def test_decide_next_action(mock_get_agents, decision_engine):
    """Test the logic for deciding the next action from a list of tasks."""
    mock_get_agents.return_value = [
        {"name": "developer_agent", "status": "active", "capabilities": ["python", "database"]},
        {"name": "qa_agent", "status": "active", "capabilities": ["testing"]}
    ]

    project_state = {}
    available_tasks = [
        {"task_id": 1, "description": "Write unit tests.", "required_capabilities": ["testing"]},
        {"task_id": 2, "description": "Fix critical bug in database.", "required_capabilities": ["python", "database"]}
    ]

    next_action = await decision_engine.decide_next_action(project_state, available_tasks)

    assert next_action is not None
    # The database task is higher priority based on default rules
    assert next_action["task_id"] == 2
    assert next_action["agent"] == "developer_agent"

def test_process_task_failure(decision_engine):
    """Test the processing of a task failure."""
    failed_task = {"task_id": 1, "description": "Generate complex code.", "agent": "developer_agent"}
    error_info = {"source_agent": "developer_agent", "error_message": "Code generation failed."}

    # Mock the sub-component
    decision_engine.learning_module.process_feedback = MagicMock()
    decision_engine.fallback_handler.handle_failure = MagicMock(
        return_value={"description": "Fallback: Review code manually."}
    )

    fallback_task = decision_engine.process_task_failure(failed_task, error_info)

    decision_engine.learning_module.process_feedback.assert_called_once()
    feedback_arg = decision_engine.learning_module.process_feedback.call_args[0][0]
    assert feedback_arg["status"] == "failure"

    assert fallback_task is not None
    assert fallback_task["description"] == "Fallback: Review code manually."
