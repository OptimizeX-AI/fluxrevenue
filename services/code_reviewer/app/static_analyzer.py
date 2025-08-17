import os
import logging
import ast
from .core.exceptions import CodeAnalysisError

logger = logging.getLogger(__name__)

def analyze_code(source_code_path: str) -> dict:
    """
    Performs a simple static analysis on a Python source file.

    This v1 implementation checks for:
    - Function length (penalizing long functions).
    - Presence of docstrings on functions.

    Args:
        source_code_path: The path to the Python file to analyze.

    Returns:
        A dictionary containing the analysis report.
    """
    logger.info("Starting static analysis.", extra={"props": {"source": source_code_path}})

    report = {
        "file_path": source_code_path,
        "overall_score": 1.0,
        "status": "PENDING",
        "summary": "",
        "issues": []
    }
    APPROVAL_THRESHOLD = 0.8

    try:
        if not os.path.exists(source_code_path):
            raise CodeAnalysisError(f"Source file not found: {source_code_path}")

        with open(source_code_path, 'r') as f:
            source_code = f.read()

        tree = ast.parse(source_code)

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Check 1: Function length (simple line count in body)
                num_lines = len(node.body)
                if num_lines > 20: # Arbitrary threshold
                    report["issues"].append(f"Function '{node.name}' is too long ({num_lines} lines).")
                    report["overall_score"] -= 0.1

                # Check 2: Docstring presence
                if not ast.get_docstring(node):
                    report["issues"].append(f"Function '{node.name}' is missing a docstring.")
                    report["overall_score"] -= 0.05

        # Ensure score doesn't go below zero and round it
        report["overall_score"] = max(0.0, round(report["overall_score"], 2))

        # Determine final status and summary
        if report["overall_score"] < APPROVAL_THRESHOLD:
            report["status"] = "REJECTED"
            report["summary"] = f"Code review failed with a score of {report['overall_score']}. Found {len(report['issues'])} issues."
        else:
            report["status"] = "APPROVED"
            report["summary"] = f"Code review passed with a score of {report['overall_score']}."

        logger.info(
            "Static analysis complete.",
            extra={"props": {
                "issues_found": len(report['issues']),
                "score": report["overall_score"],
                "status": report["status"]
            }}
        )
        return report

    except Exception as e:
        logger.error(f"An unexpected error occurred during static analysis.", exc_info=True)
        raise CodeAnalysisError(f"Failed to analyze code: {e}")
