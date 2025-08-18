from typing import Dict, Any
from .code_generator import AbstractCodeGenerator

class PythonCodeGenerator(AbstractCodeGenerator):
    """
    A simple code generator for Python and FastAPI.
    """

    def generate_project_structure(self, specification: Dict[str, Any], target_path: str):
        """
        Generates a basic FastAPI project structure.
        (This is a placeholder for a more complex implementation).
        """
        # For now, this is a simplified method. A real implementation would
        # create directories and files based on the specification.
        print(f"Simulating project structure generation at {target_path}")
        pass

    def generate_file(self, specification: Dict[str, Any]) -> str:
        """
        Generates the content of a single Python file, typically a FastAPI main file.
        """
        file_type = specification.get("type", "basic_fastapi")

        if file_type == "basic_fastapi":
            return self._generate_fastapi_hello_world(specification)
        else:
            return "# File type not recognized. Please provide a valid specification."

    def _generate_fastapi_hello_world(self, specification: Dict[str, Any]) -> str:
        """Generates a simple 'Hello, World' FastAPI application."""
        project_name = specification.get("project_name", "MyFastAPIApp")

        code = f"""\
from fastapi import FastAPI

app = FastAPI(title="{project_name}")

@app.get("/")
def read_root():
    return {{"message": "Hello, World"}}

# Add more endpoints based on the specification here...
"""
        return code

    def add_function(self, source_code: str, function_spec: Dict[str, Any]) -> str:
        """
        Adds a new function to an existing Python source code string.
        (This is a naive implementation using string concatenation).
        """
        function_name = function_spec.get("name", "new_function")
        args = ", ".join(function_spec.get("args", []))
        body = function_spec.get("body", "    pass") # Default to a pass statement

        new_function_code = f"""
def {function_name}({args}):
    \"\"\"
    This is a newly added function.
    \"\"\"
{body}
"""
        return source_code + "\n" + new_function_code
