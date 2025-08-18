from abc import ABC, abstractmethod
from typing import Dict, Optional
import os

class AbstractLanguageDetector(ABC):
    """
    Abstract base class for a language detector.
    """
    @abstractmethod
    def detect_from_filename(self, filename: str) -> Optional[str]:
        pass

    @abstractmethod
    def detect_from_content(self, source_code: str) -> Optional[str]:
        pass


class SimpleLanguageDetector(AbstractLanguageDetector):
    """
    A simple language detector that uses file extensions and basic content analysis.
    """
    def __init__(self):
        self.extension_map = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".java": "java",
            ".cs": "csharp",
            ".go": "go",
            ".html": "html",
            ".css": "css",
        }

    def detect_from_filename(self, filename: str) -> Optional[str]:
        """
        Detects the programming language based on the file extension.
        """
        _, ext = os.path.splitext(filename)
        return self.extension_map.get(ext.lower())

    def detect_from_content(self, source_code: str) -> Optional[str]:
        """
        Detects language from content by looking for common keywords.
        This is a very basic implementation.
        """
        lower_code = source_code.lower()
        if "def " in lower_code and "import " in lower_code:
            return "python"
        if "function " in lower_code and ("const " in lower_code or "let " in lower_code):
            return "javascript"
        if "public class" in source_code and "static void main" in source_code:
            return "java"
        if "package main" in lower_code and "func main" in lower_code:
            return "go"
        if "namespace " in lower_code and "class " in lower_code:
            return "csharp"
        return None
