import unittest
import sys
import os

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from multi_language.python_parser import PythonParser
from multi_language.python_generator import PythonCodeGenerator

class TestMultiLanguageFramework(unittest.TestCase):

    def setUp(self):
        """Set up instances of the parser and generator."""
        self.parser = PythonParser()
        self.generator = PythonCodeGenerator()
        self.sample_code = """
import os
from fastapi import FastAPI

app = FastAPI()

def my_function(arg1, arg2="default"):
    \"\"\"A sample function.\"\"\"
    pass

class MyClass:
    def my_method(self):
        return True
"""

    def test_python_parser_get_dependencies(self):
        """Test that the Python parser correctly identifies dependencies."""
        dependencies = self.parser.get_dependencies(self.sample_code)
        self.assertIn("os", dependencies)
        self.assertIn("fastapi", dependencies)
        self.assertEqual(len(dependencies), 2)

    def test_python_parser_get_functions(self):
        """Test that the Python parser correctly identifies functions."""
        functions = self.parser.get_functions(self.sample_code)
        self.assertEqual(len(functions), 1)
        self.assertEqual(functions[0]["name"], "my_function")
        self.assertEqual(functions[0]["args"], ["arg1", "arg2"])
        self.assertIn("A sample function.", functions[0]["docstring"])

    def test_python_generator_generate_file(self):
        """Test that the Python generator can create a file content."""
        specification = {"type": "basic_fastapi", "project_name": "TestApp"}
        generated_code = self.generator.generate_file(specification)
        self.assertIn("app = FastAPI(title=\"TestApp\")", generated_code)
        self.assertIn("@app.get(\"/\")", generated_code)

    def test_python_generator_add_function(self):
        """Test that the Python generator can add a function to existing code."""
        function_spec = {
            "name": "say_hello",
            "args": ["name"],
            "body": "    return f'Hello, {name}'"
        }
        new_code = self.generator.add_function(self.sample_code, function_spec)
        self.assertIn("def say_hello(name):", new_code)
        self.assertIn("return f'Hello, {name}'", new_code)
        # Ensure original code is still there
        self.assertIn("class MyClass:", new_code)


if __name__ == '__main__':
    unittest.main()
