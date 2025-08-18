import unittest
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.progress_tracker import ProgressTracker

class TestProgressTracker(unittest.TestCase):

    def setUp(self):
        """Set up a new ProgressTracker for each test."""
        self.tracker = ProgressTracker()
        self.project_id = "test_project"
        self.workflow = {
            "execution_plan": [
                {"task_id": "task1"},
                {"task_id": "task2"}
            ]
        }

    def test_start_tracking(self):
        """Test the initialization of project tracking."""
        self.tracker.start_tracking(self.project_id, self.workflow)
        project_data = self.tracker.projects.get(self.project_id)

        self.assertIsNotNone(project_data)
        self.assertEqual(project_data["status"], "in_progress")
        self.assertEqual(project_data["total_tasks"], 2)
        self.assertIn("task1", project_data["tasks"])
        self.assertEqual(project_data["tasks"]["task1"]["status"], "pending")

    def test_update_task_status(self):
        """Test marking tasks as started and completed."""
        self.tracker.start_tracking(self.project_id, self.workflow)

        # Mark task 1 as started
        self.tracker.mark_task_started(self.project_id, "task1")
        task1_data = self.tracker.projects[self.project_id]["tasks"]["task1"]
        self.assertEqual(task1_data["status"], "in_progress")
        self.assertIsInstance(task1_data["start_time"], datetime)

        # Mark task 1 as completed
        self.tracker.mark_task_completed(self.project_id, "task1")
        task1_data = self.tracker.projects[self.project_id]["tasks"]["task1"]
        self.assertEqual(task1_data["status"], "completed")
        self.assertIsInstance(task1_data["end_time"], datetime)

    def test_generate_report(self):
        """Test the generation of a Markdown progress report."""
        self.tracker.start_tracking(self.project_id, self.workflow)
        self.tracker.mark_task_started(self.project_id, "task1")
        self.tracker.mark_task_completed(self.project_id, "task1")

        report = self.tracker.generate_report(self.project_id)

        self.assertIn("# Progress Report for: test_project", report)
        self.assertIn("- **Progress**: 50.00%", report)
        self.assertIn("- **Task task1**: completed", report)
        self.assertIn("- **Task task2**: pending", report)


if __name__ == '__main__':
    unittest.main()
