import os
import logging
import re
from .core.exceptions import SecurityAnalysisError, ArtifactError

logger = logging.getLogger(__name__)

# Broad regex patterns to catch common insecure assignments.
# These are intentionally broad to catch more cases, even with some potential false positives.
VULNERABILITY_PATTERNS = {
    "hardcoded_password": re.compile(r'password.*[:=]', re.IGNORECASE),
    "use_of_eval": re.compile(r'\beval\s*\('),
    "insecure_debug_mode": re.compile(r'debug\s*=\s*True', re.IGNORECASE),
    "hardcoded_secret_key": re.compile(r'secret_key.*[:=]', re.IGNORECASE),
}


def analyze_code_for_vulnerabilities(source_code_path: str) -> dict:
    """
    Performs a simple, regex-based static analysis for security vulnerabilities.

    Args:
        source_code_path: The path to the Python file to analyze.

    Returns:
        A dictionary containing the security report.
    """
    logger.info("Starting security analysis.", extra={"props": {"source": source_code_path}})

    if not os.path.exists(source_code_path):
        raise ArtifactError(f"Source file not found for security analysis: {source_code_path}", path=source_code_path)

    report = {
        "file_path": source_code_path,
        "vulnerabilities_found": 0,
        "details": []
    }

    try:
        with open(source_code_path, 'r') as f:
            for line_num, line in enumerate(f, 1):
                for vuln_type, pattern in VULNERABILITY_PATTERNS.items():
                    if pattern.search(line):
                        issue = {
                            "type": vuln_type,
                            "line": line_num,
                            "code": line.strip()
                        }
                        report["details"].append(issue)
                        report["vulnerabilities_found"] += 1

        logger.info("Security analysis complete.", extra={"props": {"vulnerabilities_found": report["vulnerabilities_found"]}})
        return report

    except ArtifactError as e:
        # Re-raise ArtifactError to be handled by the agent's main loop
        raise e
    except IOError as e:
        # Handle file reading errors specifically
        logger.error(f"IOError during security analysis: {e}", exc_info=True)
        raise SecurityAnalysisError(f"Failed to read source file for analysis: {source_code_path}") from e
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"An unexpected error occurred during security analysis: {e}", exc_info=True)
        raise SecurityAnalysisError(f"An unexpected error occurred while analyzing {source_code_path}") from e
