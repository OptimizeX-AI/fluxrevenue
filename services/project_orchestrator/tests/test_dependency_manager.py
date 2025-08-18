import unittest
import sys
import os
import networkx as nx

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.dependency_manager import DependencyManager

class TestDependencyManager(unittest.TestCase):

    def setUp(self):
        """Set up a new DependencyManager for each test."""
        self.dep_manager = DependencyManager()

    def test_linear_dependency_resolution(self):
        """Test a simple linear chain of dependencies."""
        # Arrange
        tasks = [
            {"task_id": "A"},
            {"task_id": "B", "depends_on": ["A"]},
            {"task_id": "C", "depends_on": ["B"]},
        ]
        self.dep_manager.build_graph(tasks)

        # Act
        order, is_cyclic = self.dep_manager.resolve_dependencies()

        # Assert
        self.assertFalse(is_cyclic)
        self.assertEqual(order, ["A", "B", "C"])

    def test_multiple_dependencies(self):
        """Test a task that depends on multiple other tasks."""
        # Arrange
        tasks = [
            {"task_id": "A"},
            {"task_id": "B"},
            {"task_id": "C", "depends_on": ["A", "B"]},
        ]
        self.dep_manager.build_graph(tasks)

        # Act
        order, is_cyclic = self.dep_manager.resolve_dependencies()

        # Assert
        self.assertFalse(is_cyclic)
        self.assertEqual(order[-1], "C") # C must be last
        self.assertIn("A", order[:-1])
        self.assertIn("B", order[:-1])

    def test_cyclic_dependency_detection(self):
        """Test that a cyclic dependency is correctly detected."""
        # Arrange
        tasks = [
            {"task_id": "A", "depends_on": ["C"]},
            {"task_id": "B", "depends_on": ["A"]},
            {"task_id": "C", "depends_on": ["B"]},
        ]
        self.dep_manager.build_graph(tasks)

        # Act
        order, is_cyclic = self.dep_manager.resolve_dependencies()

        # Assert
        self.assertTrue(is_cyclic)
        self.assertEqual(order, [])

    def test_no_dependencies(self):
        """Test that tasks with no dependencies can be ordered."""
        # Arrange
        tasks = [
            {"task_id": "A"},
            {"task_id": "B"},
            {"task_id": "C"},
        ]
        self.dep_manager.build_graph(tasks)

        # Act
        order, is_cyclic = self.dep_manager.resolve_dependencies()

        # Assert
        self.assertFalse(is_cyclic)
        self.assertEqual(len(order), 3)
        self.assertIn("A", order)
        self.assertIn("B", order)
        self.assertIn("C", order)


if __name__ == '__main__':
    unittest.main()
