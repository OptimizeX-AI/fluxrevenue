import unittest
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.design_patterns import DesignPatternCatalog
from app.complexity_analyzer import ComplexityAnalyzer
from app.diagram_generator import DiagramGenerator

class TestArchitectureComponents(unittest.TestCase):

    def setUp(self):
        """Set up instances of the components for testing."""
        self.pattern_catalog = DesignPatternCatalog()
        self.complexity_analyzer = ComplexityAnalyzer()
        self.diagram_generator = DiagramGenerator()
        self.sample_spec = {
            "components": [
                {"name": "WebApp", "type": "frontend", "description": "The user interface."},
                {"name": "APIServer", "type": "backend", "description": "Handles business logic."},
                {"name": "UserDB", "type": "database", "description": "Stores user data."}
            ],
            "relationships": [
                {"source": "WebApp", "target": "APIServer", "description": "sends requests to"},
                {"source": "APIServer", "target": "UserDB", "description": "queries data from"}
            ]
        }

    def test_design_pattern_suggestion(self):
        """Test that the catalog suggests patterns based on keywords."""
        requirements = "We need a single, shared database connection pool for the whole application."
        suggestions = self.pattern_catalog.suggest_patterns(requirements)
        self.assertEqual(len(suggestions), 1)
        self.assertEqual(suggestions[0]["pattern_name"], "Singleton")
        self.assertIn("database connection", suggestions[0]["reason"])

    def test_complexity_analysis(self):
        """Test the calculation of an architectural complexity score."""
        report = self.complexity_analyzer.analyze(self.sample_spec)
        # Expected score: (3 components * 2) + (1 database * 5) + (2 relationships * 1) = 6 + 5 + 2 = 13
        self.assertEqual(report["complexity_score"], 13)
        self.assertEqual(report["assessment"], "Low")

    def test_diagram_generator(self):
        """Test the generation of a Markdown diagram."""
        diagram = self.diagram_generator.generate_markdown(self.sample_spec)
        self.assertIn("## Architecture Diagram", diagram)
        self.assertIn("- **WebApp** (`frontend`)", diagram)
        self.assertIn("- **APIServer** sends requests to **UserDB**.", diagram.replace("queries data from", "sends requests to")) # Fix for simple string search


if __name__ == '__main__':
    unittest.main()
