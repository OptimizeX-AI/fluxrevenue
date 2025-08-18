from abc import ABC, abstractmethod
from typing import Dict, Any, List

class AbstractLanguageParser(ABC):
    """
    Abstract base class for a language parser.
    Defines the interface for analyzing source code and extracting structured information.
    """

    @abstractmethod
    def analyze(self, source_code: str) -> Dict[str, Any]:
        """
        Analyzes the given source code and returns a structured representation.

        Args:
            source_code: A string containing the source code to analyze.

        Returns:
            A dictionary containing structured information about the code,
            such as functions, classes, dependencies, etc.
        """
        pass

    @abstractmethod
    def get_dependencies(self, source_code: str) -> List[str]:
        """
        Parses the source code to identify and list its dependencies.

        Args:
            source_code: The source code string.

        Returns:
            A list of dependency names (e.g., library or module names).
        """
        pass

    @abstractmethod
    def get_functions(self, source_code: str) -> List[Dict[str, Any]]:
        """
        Parses the source code to identify all functions and their signatures.

        Args:
            source_code: The source code string.

        Returns:
            A list of dictionaries, where each dictionary represents a function
            with details like name, arguments, and return type.
        """
        pass
