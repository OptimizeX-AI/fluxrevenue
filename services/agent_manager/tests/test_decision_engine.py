import unittest
from unittest.mock import MagicMock, patch

# Add parent directory to path to allow imports
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.decision_engine import DecisionEngine
from app.priority_manager import PriorityManager
from app.task_allocator import TaskAllocator

class TestDecisionEngine(unittest.TestCase):

    def setUp(self):
        """Set up a new DecisionEngine instance for each test."""
        self.decision_engine = DecisionEngine()

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
        # Arrange
        mock_get_agents.return_value = [
            {"name": "developer_agent", "status": "active", "capabilities": ["python"]},
            {"name": "qa_agent", "status": "active", "capabilities": ["testing"]}
        ]

        project_state = {}
        available_tasks = [
            {"task_id": 1, "description": "Write unit tests.", "agent": "qa_agent"},
            {"task_id": 2, "description": "Fix critical bug in database.", "agent": "developer_agent"}
        ]

        # Act
        next_action = self.decision_engine.decide_next_action(project_state, available_tasks)

        # Assert
        # The "critical bug" task should have higher priority and be selected.
        self.assertIsNotNone(next_action)
        self.assertEqual(next_action["task_id"], 2)
        self.assertEqual(next_action["agent"], "developer_agent")

    def test_process_task_failure(self):
        """Test the processing of a task failure."""
        # Arrange
        failed_task = {"task_id": 1, "description": "Generate complex code.", "agent": "developer_agent"}
        error_info = {"source_agent": "developer_agent", "error_message": "Code generation failed."}

        # Mock the learning module to check if it's called
        self.decision_engine.learning_module.process_feedback = MagicMock()

        # Act
        fallback_task = self.decision_engine.process_task_failure(failed_task, error_info)

        # Assert
        # The learning module should be called with failure status
        self.decision_engine.learning_module.process_feedback.assert_called_once()
        feedback_arg = self.decision_engine.learning_module.process_feedback.call_args[0][0]
        self.assertEqual(feedback_arg["status"], "failure")

        # A fallback task should be generated
        # Based on our current FallbackHandler, it should be a "simplify_task" strategy
        self.assertIsNotNone(fallback_task)
        self.assertIn("previous attempt to execute this task failed", fallback_task["description"])


if __name__ == '__main__':
    unittest.main()
