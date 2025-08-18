import logging
import os
import shutil
from typing import Dict

logger = logging.getLogger(__name__)

class AbstractBuilder:
    """Abstract base class for language-specific builders."""
    def build(self, source_path: str, output_path: str) -> Dict:
        raise NotImplementedError

class PythonBuilder(AbstractBuilder):
    """
    A simple, simulated builder for Python projects.
    It packages the source code into a zip file.
    """
    def build(self, source_path: str, output_path: str) -> Dict:
        """
        Creates a zip archive of the source directory.
        """
        logger.info(f"Simulating Python build for source: {source_path}")

        if not os.path.isdir(source_path):
            raise FileNotFoundError(f"Source directory not found: {source_path}")

        # The name of the output archive (e.g., 'my_project.zip')
        archive_name = os.path.basename(os.path.normpath(source_path))
        archive_path = os.path.join(output_path, archive_name)

        try:
            # shutil.make_archive will create a zip file of the directory
            shutil.make_archive(archive_path, 'zip', source_path)
            final_artifact_path = f"{archive_path}.zip"

            logger.info(f"Successfully created build artifact: {final_artifact_path}")
            return {
                "status": "success",
                "artifact_path": final_artifact_path,
                "builder": "python"
            }
        except Exception as e:
            logger.error(f"Failed to create build artifact: {e}", exc_info=True)
            return {"status": "failure", "error": str(e)}


class BuildManager:
    """
    Manages the build process for different languages.
    """
    def __init__(self):
        self._builders = {
            "python": PythonBuilder(),
            # "node": NodeBuilder(), # Future extension
        }
        logger.info("BuildManager initialized.")

    def build_project(self, source_path: str, language: str, output_path: str) -> Dict:
        """
        Selects the appropriate builder and executes the build.
        """
        language = language.lower()
        builder = self._builders.get(language)

        if not builder:
            raise NotImplementedError(f"No builder available for language: {language}")

        return builder.build(source_path, output_path)
