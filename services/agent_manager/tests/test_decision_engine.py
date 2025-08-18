import unittest
from unittest.mock import MagicMock, patch

# Add parent directory to path to allow imports
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.decision_engine import DecisionEngine
from app.priority_manager import PriorityManager
from app.task_allocator import TaskAllocator
from app.main import app as fastapi_app # Import the app to test the /metrics endpoint
from fastapi.testclient import TestClient

class TestDecisionEngineAndMetrics(unittest.TestCase):

    def setUp(self):
        """Set up a new DecisionEngine and a TestClient for each test."""
        self.decision_engine = DecisionEngine()
        self.client = TestClient(fastapi_app)

    def test_calculate_priority(self):
        """Test the priority calculation logic."""
        priority_manager = PriorityManager()

        task_critical = {"description": "Fix a critical security bug."}
        task_simple = {"description": "Update the UI text."}

        priority_critical = priority_manager.calculate_priority(task_critical)
        priority_simple = priority_manager.calculate_priority(task_simple)

        self.assertGreater(priority_critical, priority_simple)
        self.assertIn(priority_critical, range(1, 101))

    @patch('app.task_allocator.TaskAllocator._get_available_agents')
    def test_decide_next_action(self, mock_get_agents):
        """Test the logic for deciding the next action from a list of tasks."""
        mock_get_agents.return_value = [
            {"name": "developer_agent", "status": "active", "capabilities": ["python"]},
            {"name": "qa_agent", "status": "active", "capabilities": ["testing"]}
        ]

        project_state = {}
        available_tasks = [
            {"task_id": 1, "description": "Write unit tests.", "agent": "qa_agent"},
            {"task_id": 2, "description": "Fix critical bug in database.", "agent": "developer_agent"}
        ]

        next_action = self.decision_engine.decide_next_action(project_state, available_tasks)

        self.assertIsNotNone(next_action)
        self.assertEqual(next_action["task_id"], 2)
        self.assertEqual(next_action["agent"], "developer_agent")

    def test_process_task_failure(self):
        """Test the processing of a task failure."""
        failed_task = {"task_id": 1, "description": "Generate complex code.", "agent": "developer_agent"}
        error_info = {"source_agent": "developer_agent", "error_message": "Code generation failed."}

        self.decision_engine.learning_module.process_feedback = MagicMock()

        fallback_task = self.decision_engine.process_task_failure(failed_task, error_info)

        self.decision_engine.learning_module.process_feedback.assert_called_once()
        feedback_arg = self.decision_engine.learning_module.process_feedback.call_args[0][0]
        self.assertEqual(feedback_arg["status"], "failure")

        self.assertIsNotNone(fallback_task)
        self.assertIn("previous attempt to execute this task failed", fallback_task["description"])

    def test_custom_metrics_are_exposed(self):
        """
        Test that the custom Prometheus metrics are exposed on the /metrics endpoint.
        """
        # This is an integration test that relies on the app instance.
        # We don't need to trigger the logic that increments the counters,
        # just check that they exist and are exposed with a value of 0.

        response = self.client.get("/metrics")
        self.assertEqual(response.status_code, 200)

        metrics_text = response.text
        self.assertIn("agent_manager_decisions_made_total", metrics_text)
        self.assertIn("agent_manager_task_prioritization_duration_seconds_bucket", metrics_text)
        self.assertIn("agent_manager_task_prioritization_duration_seconds_count", metrics_text)
        self.assertIn("agent_manager_task_prioritization_duration_seconds_sum", metrics_text)


if __name__ == '__main__':
    unittest.main()
