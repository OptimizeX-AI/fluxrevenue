from abc import ABC, abstractmethod
from typing import Dict, Any

class AbstractCodeGenerator(ABC):
    """
    Abstract base class for a code generator.
    Defines the interface for generating source code from a structured specification.
    """

    @abstractmethod
    def generate_project_structure(self, specification: Dict[str, Any], target_path: str):
        """
        Generates the directory and file structure for a new project.

        Args:
            specification: A dictionary describing the project structure.
            target_path: The root path where the project should be generated.
        """
        pass

    @abstractmethod
    def generate_file(self, specification: Dict[str, Any]) -> str:
        """
        Generates the content of a single source code file.

        Args:
            specification: A dictionary describing the file to be generated,
                           including its purpose, functions, classes, etc.

        Returns:
            A string containing the generated source code.
        """
        pass

    @abstractmethod
    def add_function(self, source_code: str, function_spec: Dict[str, Any]) -> str:
        """
        Adds a new function to an existing piece of source code.

        Args:
            source_code: The existing source code string.
            function_spec: A dictionary describing the function to add.

        Returns:
            The modified source code string with the new function.
        """
        pass
