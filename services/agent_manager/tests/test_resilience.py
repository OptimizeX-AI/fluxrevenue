import pytest
from unittest.mock import patch, MagicMock
import pybreaker
import httpx
import tenacity

from ..app.task_allocator import TaskAllocator
from services.common import resilience

@pytest.fixture
def allocator_with_reset_breaker():
    """Fixture to provide a TaskAllocator and reset the global breaker state."""
    # The 'close' method on the breaker moves it to the closed state.
    resilience.breaker.close()
    yield TaskAllocator()
    resilience.breaker.close()

@patch('httpx.Client.get')
def test_retry_logic_success_on_second_attempt(mock_get, allocator_with_reset_breaker):
    """Test that the retry decorator works and succeeds on a subsequent attempt."""
    allocator = allocator_with_reset_breaker
    # Arrange: Fail on the first call, succeed on the second
    mock_get.side_effect = [
        httpx.RequestError("Connection failed"),
        MagicMock(status_code=200, json=lambda: [{"name": "test_agent", "status": "active"}])
    ]

    # Act
    agents = allocator._get_available_agents()

    # Assert
    assert mock_get.call_count == 2
    assert len(agents) == 1
    assert agents[0]["name"] == "test_agent"

@patch('httpx.Client.get')
def test_circuit_breaker_opens_after_failures(mock_get, allocator_with_reset_breaker):
    """Test that the circuit breaker opens after the configured number of failures."""
    allocator = allocator_with_reset_breaker
    # Arrange: Make all calls fail
    mock_get.side_effect = httpx.ConnectTimeout("Connection timed out")

    # Act & Assert
    # The first 3 calls should fail, tripping the breaker
    for _ in range(resilience.breaker.fail_max):
        with pytest.raises(Exception):
             allocator._get_available_agents_from_registry()

    assert resilience.breaker.current_state == "open"

    # The next call is wrapped by tenacity, which will raise RetryError
    # after its attempts fail due to the open circuit breaker.
    with pytest.raises(tenacity.RetryError) as excinfo:
        allocator._get_available_agents_from_registry()

    # We can inspect the underlying exception to confirm it was the breaker
    assert isinstance(excinfo.value.last_attempt.exception(), pybreaker.CircuitBreakerError)

    # The http call should only have been made 3 times (the fail_max of the breaker)
    assert mock_get.call_count == resilience.breaker.fail_max
