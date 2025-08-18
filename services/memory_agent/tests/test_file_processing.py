import unittest
from unittest.mock import MagicMock, patch
import os

# Add parent directory to path to allow imports
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.file_processor import FileProcessor
from app.knowledge_extractor import KnowledgeExtractor
from app.knowledge_graph import KnowledgeGraph
from app.semantic_search import SemanticSearch

class TestFileProcessing(unittest.TestCase):

    def setUp(self):
        """Set up components for testing."""
        self.file_processor = FileProcessor()
        self.mock_kg = MagicMock(spec=KnowledgeGraph)
        self.mock_search = MagicMock(spec=SemanticSearch)
        self.knowledge_extractor = KnowledgeExtractor(self.mock_kg, self.mock_search)

        # Create a dummy markdown file for testing
        self.test_dir = "test_learning_materials"
        os.makedirs(self.test_dir, exist_ok=True)
        self.md_filepath = os.path.join(self.test_dir, "test_doc.md")
        with open(self.md_filepath, "w") as f:
            f.write("# FastAPI Guide\n\nThis is a guide about FastAPI.\n\n## Code Example\n\n`print('hello')`")

    def tearDown(self):
        """Clean up test files."""
        os.remove(self.md_filepath)
        os.rmdir(self.test_dir)

    def test_file_processor_reads_markdown(self):
        """Test that the FileProcessor can correctly read and extract text from a Markdown file."""
        result = self.file_processor.process_file(self.md_filepath)
        self.assertIsNotNone(result)
        content_type, text_content = result
        self.assertEqual(content_type, "markdown")
        # BeautifulSoup strips tags and should leave clean text
        self.assertIn("FastAPI Guide", text_content)
        self.assertIn("This is a guide about FastAPI", text_content)
        self.assertIn("print('hello')", text_content)

    def test_knowledge_extractor(self):
        """Test that the KnowledgeExtractor correctly updates the KG and Search Index."""
        # Arrange
        text_content = "This document discusses FastAPI and Docker."
        source_uri = "test_doc.md"
        content_type = "markdown"

        # Act
        self.knowledge_extractor.extract_and_integrate(text_content, source_uri, content_type)

        # Assert
        # Check that the document was added as an entity to the KG
        self.mock_kg.add_entity.assert_any_call(
            "test_doc.md",
            "TechnicalDocument",
            {"name": "test_doc.md", "format": "markdown"}
        )

        # Check that the full content was indexed for semantic search
        self.mock_search.index_document.assert_called_once_with(
            doc_id="test_doc.md",
            content="This document discusses FastAPI and Docker."
        )

        # Check that the extracted technologies were added and linked in the KG
        self.mock_kg.add_entity.assert_any_call("FastAPI", "Technology", {"name": "FastAPI", "description": "A Python web framework."})
        self.mock_kg.add_relationship.assert_any_call("test_doc.md", "FastAPI", "MENTIONS")

        self.mock_kg.add_entity.assert_any_call("Docker", "Technology", {"name": "Docker", "description": "A platform for developing, shipping, and running applications in containers."})
        self.mock_kg.add_relationship.assert_any_call("test_doc.md", "Docker", "MENTIONS")


if __name__ == '__main__':
    unittest.main()
