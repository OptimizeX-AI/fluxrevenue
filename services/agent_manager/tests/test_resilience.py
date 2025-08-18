import unittest
from unittest.mock import patch, MagicMock
import pybreaker
import httpx

# Add parent directory to path to allow imports
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.task_allocator import TaskAllocator
# We need to access the breaker instance from the common module to inspect its state
from services.common import resilience

class TestResilience(unittest.TestCase):

    def setUp(self):
        """Reset the circuit breaker before each test."""
        resilience.breaker.reset()
        self.allocator = TaskAllocator()

    @patch('httpx.Client.get')
    def test_retry_logic_success_on_second_attempt(self, mock_get):
        """Test that the retry decorator works and succeeds on a subsequent attempt."""
        # Arrange
        # Fail on the first call, succeed on the second
        mock_get.side_effect = [
            httpx.RequestError("Connection failed"),
            MagicMock(status_code=200, json=lambda: [{"name": "test_agent", "status": "active"}])
        ]

        # Act
        agents = self.allocator._get_available_agents()

        # Assert
        self.assertEqual(mock_get.call_count, 2) # It should have been called twice
        self.assertEqual(len(agents), 1)
        self.assertEqual(agents[0]["name"], "test_agent")

    @patch('httpx.Client.get')
    def test_circuit_breaker_opens_after_failures(self, mock_get):
        """Test that the circuit breaker opens after the configured number of failures."""
        # Arrange
        # Make all calls fail
        mock_get.side_effect = httpx.ConnectTimeout("Connection timed out")

        # Act & Assert
        # The first 3 calls should fail and be retried, tripping the breaker
        with self.assertRaises(pybreaker.CircuitBreakerError):
            for _ in range(4): # 3 to trip, 1 to test if open
                try:
                    self.allocator._get_available_agents_from_registry()
                except Exception:
                    # We expect exceptions here as it fails and retries
                    pass

        self.assertTrue(resilience.breaker.is_open)
        # The http call should only have been made 3 times (the fail_max of the breaker)
        # because the breaker prevents subsequent calls.
        self.assertEqual(mock_get.call_count, resilience.breaker.fail_max)


if __name__ == '__main__':
    unittest.main()
