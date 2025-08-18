import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class DiagramGenerator:
    """
    Generates textual diagrams of software architecture.
    This implementation produces Markdown output.
    """
    def __init__(self):
        logger.info("DiagramGenerator initialized.")

    def generate_markdown(self, architecture_spec: Dict[str, Any]) -> str:
        """
        Generates a Markdown representation of the architecture.

        Args:
            architecture_spec: A dictionary describing the architecture.

        Returns:
            A string containing the Markdown diagram.
        """
        if not architecture_spec.get("components"):
            return "## Architecture Diagram\n\nNo components specified."

        markdown = "## Architecture Diagram\n\n"
        markdown += "This diagram outlines the main components and their relationships.\n\n"

        # 1. List Components
        markdown += "### Components\n\n"
        for component in architecture_spec.get("components", []):
            name = component.get("name", "Unnamed Component")
            comp_type = component.get("type", "Generic")
            description = component.get("description", "No description.")
            markdown += f"- **{name}** (`{comp_type}`): {description}\n"

        markdown += "\n"

        # 2. List Relationships
        markdown += "### Relationships\n\n"
        relationships = architecture_spec.get("relationships", [])
        if not relationships:
            markdown += "No relationships defined.\n"
        else:
            for rel in relationships:
                source = rel.get("source", "?")
                target = rel.get("target", "?")
                description = rel.get("description", "interacts with")
                markdown += f"- **{source}** {description} **{target}**.\n"

        logger.info("Generated Markdown architecture diagram.")
        return markdown
