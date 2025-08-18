import ast
from typing import Dict, Any, List
from .language_parser import AbstractLanguageParser

class PythonParser(AbstractLanguageParser):
    """
    A parser for Python source code using the built-in 'ast' module.
    """

    def analyze(self, source_code: str) -> Dict[str, Any]:
        """
        Analyzes Python source code to extract functions, classes, and imports.
        """
        try:
            tree = ast.parse(source_code)
            return {
                "functions": self.get_functions(source_code, tree),
                "classes": self._get_classes(tree),
                "dependencies": self.get_dependencies(source_code, tree)
            }
        except SyntaxError as e:
            return {"error": f"Invalid Python syntax: {e}"}

    def get_dependencies(self, source_code: str, tree: ast.AST = None) -> List[str]:
        """
        Extracts import statements from Python code.
        """
        if tree is None:
            try:
                tree = ast.parse(source_code)
            except SyntaxError:
                return []

        dependencies = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    dependencies.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                dependencies.append(node.module)
        return sorted(list(set(dependencies)))

    def get_functions(self, source_code: str, tree: ast.AST = None) -> List[Dict[str, Any]]:
        """
        Extracts function definitions from Python code.
        """
        if tree is None:
            try:
                tree = ast.parse(source_code)
            except SyntaxError:
                return []

        functions = []
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append({
                    "name": node.name,
                    "args": [arg.arg for arg in node.args.args],
                    "defaults": len(node.args.defaults),
                    "docstring": ast.get_docstring(node)
                })
        return functions

    def _get_classes(self, tree: ast.AST) -> List[Dict[str, Any]]:
        """
        Extracts class definitions from Python code.
        """
        classes = []
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                methods = [n.name for n in node.body if isinstance(n, ast.FunctionDef)]
                classes.append({
                    "name": node.name,
                    "methods": methods,
                    "bases": [base.id for base in node.bases if isinstance(base, ast.Name)]
                })
        return classes
