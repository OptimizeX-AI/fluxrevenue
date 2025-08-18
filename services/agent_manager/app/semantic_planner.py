import logging
import copy
from services.agent_manager.app.core.nlp_extractor import NLPExtractor
from services.agent_manager.app.planning_templates import PLAN_TEMPLATES

logger = logging.getLogger(__name__)

class SemanticPlanner:
    """
    Generates a contextualized execution plan by understanding requirements,
    selecting a template, and populating it with extracted entities.
    """
    def __init__(self):
        """Initializes the planner and its components."""
        self.nlp_extractor = NLPExtractor()
        logger.info("SemanticPlanner initialized.")

    def _select_template(self, entities: dict) -> list:
        """Selects a plan template based on extracted architectural entities."""
        architectures = set(entities.get("architectures", []))
        logger.info(f"Selecting template based on architectures: {architectures}")

        # More specific templates should be checked first
        if "frontend" in architectures and ("backend" in architectures or "api" in architectures):
            logger.info("Architecture detected: FULL_STACK. Selecting corresponding template.")
            return PLAN_TEMPLATES["FULL_STACK"]

        if "api" in architectures or "backend" in architectures:
            logger.info("Architecture detected: API_ONLY. Selecting corresponding template.")
            return PLAN_TEMPLATES["API_ONLY"]

        logger.info("No specific architecture pattern detected. Using DEFAULT template.")
        return PLAN_TEMPLATES["DEFAULT"]

    def _populate_template(self, template: list, entities: dict) -> list:
        """Populates placeholders in a plan template with extracted entities."""
        # Create a deep copy to avoid modifying the original template in memory
        plan = copy.deepcopy(template)

        # Prepare entity strings for formatting. Provide defaults if empty.
        features_str = ", ".join(entities.get("features")) if entities.get("features") else "specified features"
        tech_str = ", ".join(entities.get("technologies")) if entities.get("technologies") else "standard technologies"

        for task in plan:
            # Use .format() to replace placeholders like {features}
            task["description"] = task["description"].format(
                features=features_str,
                technologies=tech_str
            )
        return plan

    def generate_plan(self, requirements: str) -> list:
        """
        Generates a contextualized, dependency-aware execution plan.

        This method orchestrates the planning pipeline:
        1. Extract entities from requirements using NLP.
        2. Select an appropriate plan template based on the entities.
        3. Populate the template with details to create a contextual plan.
        """
        logger.info("Starting semantic plan generation process.")

        # 1. Extract entities
        entities = self.nlp_extractor.extract_entities(requirements)

        # 2. Select template
        template = self._select_template(entities)

        # 3. Populate template
        contextual_plan = self._populate_template(template, entities)

        logger.info(f"Successfully generated a contextual plan with {len(contextual_plan)} tasks.")
        return contextual_plan
