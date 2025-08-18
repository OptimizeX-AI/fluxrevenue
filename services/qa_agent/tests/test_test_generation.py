import unittest
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.test_generator_factory import TestGeneratorFactory
from app.unit_test_generator import PythonUnit_test_generator

class TestTestGenerationFramework(unittest.TestCase):

    def setUp(self):
        """Set up instances of the components for testing."""
        self.factory = TestGeneratorFactory()

    def test_factory_get_python_unit_generator(self):
        """Test that the factory returns the correct generator for python unit tests."""
        generator = self.factory.get_generator("python", "unit")
        self.assertIsInstance(generator, PythonUnit_test_generator)

    def test_factory_get_unsupported_language(self):
        """Test that the factory returns None for an unsupported language."""
        generator = self.factory.get_generator("javascript", "unit")
        self.assertIsNone(generator)

    def test_factory_get_unsupported_test_type(self):
        """Test that the factory returns None for an unsupported test type."""
        generator = self.factory.get_generator("python", "integration")
        self.assertIsNone(generator)

    def test_python_unit_test_generator(self):
        """Test the basic output of the Python unit test generator."""
        generator = PythonUnit_test_generator()
        code_artifact = {"path": "app/my_module.py"}
        test_spec = {"function_name": "calculate_sum"}

        test_code = generator.generate(code_artifact, test_spec)

        self.assertIn("import unittest", test_code)
        self.assertIn("from app.my_module import calculate_sum", test_code)
        self.assertIn("class TestCalculate_sum(unittest.TestCase):", test_code)
        self.assertIn("def test_basic_case(self):", test_code)


if __name__ == '__main__':
    unittest.main()
