import pytest
from unittest.mock import MagicMock, AsyncMock
from ..app.decision_engine import DecisionEngine

@pytest.fixture
def decision_engine(monkeypatch):
    """Fixture to create a DecisionEngine with mocked dependencies."""
    engine = DecisionEngine()
    # Mock the task allocator to control its behavior
    engine.task_allocator.select_agent = MagicMock(return_value="mock_agent_1")
    # Mock the cache manager methods to be async
    engine.decision_cache.get_cached_decision = AsyncMock(return_value=None)
    engine.decision_cache.cache_decision = AsyncMock()
    return engine

@pytest.mark.asyncio
async def test_decision_engine_caching_flow(decision_engine):
    """
    Tests that the DecisionEngine correctly uses the cache.
    It should call the task allocator on the first run and use the cache on the second.
    """
    task = {"description": "A recurring, expensive task"}
    project_state = {}
    available_tasks = [task]

    # --- First Call (should populate the cache) ---
    await decision_engine.decide_next_action(project_state, available_tasks)

    # Assert that the task allocator was called
    decision_engine.task_allocator.select_agent.assert_called_once_with(task)
    # Assert that the result was cached
    decision_engine.decision_cache.cache_decision.assert_called_once_with(
        task["description"], {"agent": "mock_agent_1"}
    )

    # --- Second Call (should hit the cache) ---

    # Reset mocks for the second call check
    decision_engine.task_allocator.select_agent.reset_mock()
    decision_engine.decision_cache.cache_decision.reset_mock()

    # Configure the mock to return the cached value on the second call
    decision_engine.decision_cache.get_cached_decision.return_value = {"agent": "mock_agent_1"}

    result = await decision_engine.decide_next_action(project_state, available_tasks)

    # Assert that the task allocator was NOT called this time
    decision_engine.task_allocator.select_agent.assert_not_called()
    # Assert that the cache was not written to again (it was a read)
    decision_engine.decision_cache.cache_decision.assert_not_called()
    # Assert that the final result contains the cached agent
    assert result["agent"] == "mock_agent_1"
