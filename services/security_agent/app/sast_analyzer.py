import logging
import ast
from typing import List, Dict

logger = logging.getLogger(__name__)

class SASTAnalyzer:
    """
    A simple Static Application Security Testing (SAST) analyzer for Python.
    It uses the Abstract Syntax Tree (AST) to find potentially unsafe patterns.
    """
    def __init__(self):
        self.unsafe_functions = {
            "eval": "Critical: Use of 'eval' can lead to arbitrary code execution.",
            "exec": "Critical: Use of 'exec' can lead to arbitrary code execution.",
            "pickle.loads": "High: Unpickling data from untrusted sources can lead to remote code execution.",
            "subprocess.call": "Medium: Use of 'subprocess.call' with shell=True can be dangerous.",
            "os.system": "Medium: Use of 'os.system' can be vulnerable to shell injection."
        }
        logger.info("SASTAnalyzer initialized with unsafe function patterns.")

    def analyze_source_code(self, source_code: str, filename: str) -> List[Dict]:
        """
        Analyzes Python source code for unsafe function calls.

        Args:
            source_code: The string content of the Python file.
            filename: The name of the file for reporting.

        Returns:
            A list of dictionaries representing found SAST issues.
        """
        issues = []
        try:
            tree = ast.parse(source_code)
        except SyntaxError as e:
            logger.warning(f"Could not parse {filename} for SAST analysis due to SyntaxError: {e}")
            return []

        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                # This is a very basic check. A real SAST tool would need to resolve imports
                # and track variable types to be accurate.

                # Check for simple function calls like eval()
                if isinstance(node.func, ast.Name) and node.func.id in self.unsafe_functions:
                    issue = {
                        "type": "sast_issue",
                        "file": filename,
                        "line": node.lineno,
                        "description": self.unsafe_functions[node.func.id],
                        "severity": self.unsafe_functions[node.func.id].split(":")[0]
                    }
                    issues.append(issue)

                # Check for attribute calls like pickle.loads()
                elif isinstance(node.func, ast.Attribute) and node.func.attr in self.unsafe_functions:
                    issue = {
                        "type": "sast_issue",
                        "file": filename,
                        "line": node.lineno,
                        "description": self.unsafe_functions[node.func.attr],
                        "severity": self.unsafe_functions[node.func.attr].split(":")[0]
                    }
                    issues.append(issue)

        if issues:
            logger.info(f"Found {len(issues)} potential SAST issues in {filename}.")
        return issues
