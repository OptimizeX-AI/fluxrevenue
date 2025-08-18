import unittest
from unittest.mock import MagicMock, patch

# Add parent directory to path to allow imports
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.memory_processor import process_event_for_memory
from app.knowledge_graph import KnowledgeGraph
from app.semantic_search import SemanticSearch

class TestMemoryProcessor(unittest.TestCase):

    def setUp(self):
        """Set up fresh mocks for each test."""
        self.mock_kg = MagicMock(spec=KnowledgeGraph)
        self.mock_search = MagicMock(spec=SemanticSearch)

    def test_process_plan_generated_event(self):
        """Test that a 'plan_generated' event correctly updates memory components."""
        # Arrange
        event = {
            "event_type": "plan_generated",
            "project_name": "TestProject",
            "source_agent": "agent_manager",
            "data": {
                "plan": [
                    {"task_id": 1, "description": "First task"},
                    {"task_id": 2, "description": "Second task"}
                ]
            }
        }

        # Act
        process_event_for_memory(event, self.mock_kg, self.mock_search)

        # Assert
        # It should add project and agent entities
        self.mock_kg.add_entity.assert_any_call("TestProject", "Project", {"name": "TestProject"})
        self.mock_kg.add_entity.assert_any_call("agent_manager", "Agent", {"name": "agent_manager"})

        # It should index the plan for semantic search
        self.mock_search.index_document.assert_called_once_with(
            "TestProject_plan",
            "Task 1: First task\nTask 2: Second task"
        )

        # It should add the plan to the knowledge graph
        self.mock_kg.add_entity.assert_any_call("TestProject_plan", "ExecutionPlan", {"full_text": "Task 1: First task\nTask 2: Second task"})
        self.mock_kg.add_relationship.assert_any_call("agent_manager", "TestProject_plan", "GENERATED")
        self.mock_kg.add_relationship.assert_any_call("TestProject_plan", "TestProject", "PLAN_FOR")

    def test_process_artifacts_stored_event(self):
        """Test that an 'artifacts_stored' event correctly updates memory components."""
        # Arrange
        event = {
            "event_type": "artifacts_stored",
            "project_name": "TestProject",
            "source_agent": "developer_agent",
            "data": {
                "task_id": 1,
                "artifacts": [
                    {"name": "app.py", "content": "print('hello')"}
                ]
            }
        }

        # Act
        process_event_for_memory(event, self.mock_kg, self.mock_search)

        # Assert
        artifact_entity_id = "TestProject_artifact_app.py"
        task_entity_id = "TestProject_task_1"

        self.mock_kg.add_entity.assert_any_call(artifact_entity_id, "Artifact", {"name": "app.py", "content": "print('hello')"})
        self.mock_search.index_document.assert_called_once_with(artifact_entity_id, "print('hello')")
        self.mock_kg.add_relationship.assert_called_once_with(task_entity_id, artifact_entity_id, "PRODUCED")


if __name__ == '__main__':
    unittest.main()
