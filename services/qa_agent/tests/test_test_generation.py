import pytest
from services.qa_agent.app.generator_factory import TestGeneratorFactory
from services.qa_agent.app.unit_test_generator import PythonUnitTestGenerator

@pytest.fixture
def factory():
    """Provides a TestGeneratorFactory instance for testing."""
    return TestGeneratorFactory()

def test_factory_get_python_unit_generator(factory):
    """Test that the factory returns the correct generator for python unit tests."""
    generator = factory.get_generator("python", "unit")
    assert isinstance(generator, PythonUnitTestGenerator)

def test_factory_get_unsupported_language(factory):
    """Test that the factory returns None for an unsupported language."""
    generator = factory.get_generator("javascript", "unit")
    assert generator is None

def test_factory_get_unsupported_test_type(factory):
    """Test that the factory returns None for an unsupported test type."""
    generator = factory.get_generator("python", "integration")
    assert generator is None

def test_python_unit_test_generator():
    """Test the basic output of the Python unit test generator."""
    generator = PythonUnitTestGenerator()
    code_artifact = {"path": "app/my_module.py"}
    test_spec = {"function_name": "calculate_sum"}

    test_code = generator.generate(code_artifact, test_spec)

    assert "import unittest" in test_code
    assert "from app.my_module import calculate_sum" in test_code
    assert "class TestCalculate_sum(unittest.TestCase):" in test_code
    assert "def test_basic_case(self):" in test_code
