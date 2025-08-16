import os
import logging
import zipfile
from .core.exceptions import PackagingError

logger = logging.getLogger(__name__)

WORKSPACE_DIR = "workspace"

def create_project_archive(project_name: str, file_paths: list) -> str:
    """
    Creates a zip archive containing all specified project files.

    Args:
        project_name: The name of the project, used for the directory name.
        file_paths: A list of paths to the files to be included in the archive.

    Returns:
        The path to the generated zip archive.
    """
    logger.info("Starting project packaging.", extra={"props": {"project": project_name, "file_count": len(file_paths)}})

    try:
        project_dir_name = project_name.replace(" ", "_").lower()
        archive_path = os.path.join(WORKSPACE_DIR, f"{project_dir_name}.zip")

        # Ensure the parent directory for the archive exists
        os.makedirs(os.path.dirname(archive_path), exist_ok=True)

        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in file_paths:
                if os.path.exists(file_path):
                    # To create a clean structure inside the zip, we calculate
                    # the path relative to the workspace root.
                    # e.g., 'workspace/my_project/src/main.py' becomes 'my_project/src/main.py'
                    arcname = os.path.relpath(file_path, WORKSPACE_DIR)
                    zipf.write(file_path, arcname=arcname)
                    logger.debug(f"Adding {file_path} to archive as {arcname}")
                else:
                    logger.warning(f"Artifact file not found during packaging, skipping: {file_path}")

        logger.info("Successfully created project archive.", extra={"props": {"path": archive_path}})
        return archive_path

    except Exception as e:
        logger.error("An unexpected error occurred during packaging.", exc_info=True)
        raise PackagingError(f"An unexpected error occurred during packaging: {e}")
