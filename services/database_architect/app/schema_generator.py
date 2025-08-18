import os
import logging
from .core.exceptions import SchemaGenerationError

logger = logging.getLogger(__name__)

WORKSPACE_DIR = "workspace"

def generate_sqlalchemy_models(project_name: str, entities: list) -> str:
    """
    Generates a Python script with SQLAlchemy models based on a list of entities.

    Args:
        project_name: The name of the project, used for the directory.
        entities: A list of entity names (e.g., ['user', 'product']).

    Returns:
        The path to the generated models.py file.
    """
    logger.info("Starting schema generation.", extra={"props": {"project": project_name, "entities": entities}})

    try:
        # Sanitize project_name to be a valid directory name
        project_dir_name = project_name.replace(" ", "_").lower()
        project_path = os.path.join(WORKSPACE_DIR, project_dir_name)
        os.makedirs(project_path, exist_ok=True)

        file_path = os.path.join(project_path, "models.py")

        # Start of the Python script content
        script_content = '''"""
Auto-generated SQLAlchemy models by the Database Architect Agent.
"""
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

'''
        # Generate a class for each entity
        for entity in entities:
            class_name = entity.strip().capitalize()
            if not class_name:
                continue

            table_name = f"{class_name.lower()}s"

            script_content += f'''
class {class_name}(Base):
    """SQLAlchemy model for a {class_name}."""
    __tablename__ = "{table_name}"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    # Add other common fields, or parse more details from task description
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

'''
        with open(file_path, "w") as f:
            f.write(script_content)

        logger.info("Successfully generated schema file.", extra={"props": {"path": file_path}})
        return file_path

    except IOError as e:
        logger.error(f"Failed to write schema file: {e}", exc_info=True)
        raise SchemaGenerationError(f"File I/O error: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred during schema generation: {e}", exc_info=True)
        raise SchemaGenerationError(f"An unexpected error occurred: {e}")
