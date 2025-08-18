import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ComplexityAnalyzer:
    """
    Analyzes the complexity of a proposed software architecture.
    """
    def __init__(self):
        self.weights = {
            "component_count": 2,
            "relationship_count": 1,
            "database_component": 5, # Components that are databases add more complexity
            "external_api": 8, # Components that are external APIs add significant complexity
        }
        logger.info("ComplexityAnalyzer initialized.")

    def analyze(self, architecture_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates a complexity score for a given architecture specification.

        Args:
            architecture_spec: A dictionary describing the architecture,
                               expected to have 'components' and 'relationships'.

        Returns:
            A dictionary containing the complexity score and a qualitative assessment.
        """
        components = architecture_spec.get("components", [])
        relationships = architecture_spec.get("relationships", [])

        score = 0

        # Score based on number of components
        score += len(components) * self.weights["component_count"]

        # Add score for specific component types
        for component in components:
            comp_type = component.get("type", "").lower()
            if comp_type == "database":
                score += self.weights["database_component"]
            elif comp_type == "external_api":
                score += self.weights["external_api"]

        # Score based on number of relationships
        score += len(relationships) * self.weights["relationship_count"]

        # Determine qualitative assessment
        if score > 50:
            assessment = "Very High"
        elif score > 30:
            assessment = "High"
        elif score > 15:
            assessment = "Moderate"
        else:
            assessment = "Low"

        result = {
            "complexity_score": score,
            "assessment": assessment,
            "details": {
                "component_count": len(components),
                "relationship_count": len(relationships)
            }
        }

        logger.info(f"Calculated architectural complexity: {assessment} (Score: {score})")
        return result
