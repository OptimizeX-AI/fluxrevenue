import unittest
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.dependency_manager import AdvancedDependencyManager

class TestConflictResolution(unittest.TestCase):

    def setUp(self):
        """Set up a new AdvancedDependencyManager for each test."""
        self.dep_manager = AdvancedDependencyManager()

    def test_resource_contention_resolution(self):
        """
        Test that two tasks competing for the same exclusive resource
        have a dependency added between them to serialize access.
        """
        # Arrange
        tasks = [
            {"task_id": "A", "exclusive_resource": "DEPLOYMENT_ENV"},
            {"task_id": "B", "exclusive_resource": "DEPLOYMENT_ENV"},
            {"task_id": "C", "depends_on": ["A", "B"]}
        ]

        # Act
        # The analyze_and_resolve method should detect the conflict and add an edge.
        ordered_plan = self.dep_manager.analyze_and_resolve(tasks)

        # The final execution order as a list of IDs
        final_order = [task['task_id'] for task in ordered_plan]

        # Assert
        # The resolver should have added an edge between A and B.
        # Let's check if either (A -> B) or (B -> A) exists in the final graph.
        # This means that one must come before the other in the final plan.

        # Find the positions of A and B in the final ordering
        pos_A = final_order.index("A")
        pos_B = final_order.index("B")

        # C must be last
        self.assertEqual(final_order[-1], "C")

        # A and B must not be in the same "rank" - one must precede the other.
        # This is implicitly tested by the fact that topological sort produces a linear order.
        # A more direct test is to check the graph edges after resolution.
        self.assertTrue(self.dep_manager.graph.has_edge("A", "B") or self.dep_manager.graph.has_edge("B", "A"))

        # The length should still be 3
        self.assertEqual(len(final_order), 3)


if __name__ == '__main__':
    unittest.main()
