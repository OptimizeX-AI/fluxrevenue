import os
import json
import logging
from .core.exceptions import ArchitectureDecisionError

logger = logging.getLogger(__name__)

WORKSPACE_DIR = "workspace"

def generate_architecture_document(project_name: str, decisions: dict) -> str:
    """
    Generates a JSON file documenting the architectural decisions for the project.

    Args:
        project_name: The name of the project, used for the directory.
        decisions: A dictionary containing the architectural decisions.

    Returns:
        The path to the generated architecture.json file.
    """
    logger.info("Starting architecture document generation.", extra={"props": {"project": project_name, "decisions": decisions}})

    try:
        # Sanitize project_name to be a valid directory name
        project_dir_name = project_name.replace(" ", "_").lower()
        project_path = os.path.join(WORKSPACE_DIR, project_dir_name)
        os.makedirs(project_path, exist_ok=True)

        file_path = os.path.join(project_path, "architecture.json")

        with open(file_path, "w") as f:
            json.dump(decisions, f, indent=2)

        logger.info("Successfully generated architecture document.", extra={"props": {"path": file_path}})
        return file_path

    except IOError as e:
        logger.error(f"Failed to write architecture file: {e}", exc_info=True)
        raise ArchitectureDecisionError(f"File I/O error during architecture document generation: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred during architecture document generation: {e}", exc_info=True)
        raise ArchitectureDecisionError(f"An unexpected error occurred during architecture document generation: {e}")
