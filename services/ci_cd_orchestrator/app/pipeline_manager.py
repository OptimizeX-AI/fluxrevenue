import logging
from typing import Dict

logger = logging.getLogger(__name__)

class PipelineManager:
    """
    Manages the creation of simple CI/CD pipeline configurations.
    """
    def __init__(self):
        logger.info("PipelineManager initialized.")

    def create_pipeline(self, language: str, build_command: str) -> str:
        """
        Generates a simple shell script to act as a pipeline.

        Args:
            language: The programming language of the project.
            build_command: The command to build the project.

        Returns:
            A string containing the generated shell script.
        """
        logger.info(f"Generating simple pipeline script for a {language} project.")

        # This is a very basic representation of a pipeline config (e.g., a Jenkinsfile or .gitlab-ci.yml)
        script = f"""\
#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

echo "--- Starting CI/CD Pipeline for {language} project ---"

# --- Linting Step (Placeholder) ---
echo "1. Running linter..."
# In a real pipeline, you would run something like: flake8 . or eslint .
echo "Linting complete."

# --- Testing Step (Placeholder) ---
echo "2. Running tests..."
# In a real pipeline, you would run something like: python -m unittest discover
echo "Tests passed."

# --- Build Step ---
echo "3. Building project..."
{build_command}
echo "Build successful."

echo "--- CI/CD Pipeline Finished ---"
"""
        return script
