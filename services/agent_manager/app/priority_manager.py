import logging
from typing import Dict

logger = logging.getLogger(__name__)

class PriorityManager:
    """
    Manages the prioritization of tasks based on a set of rules.
    """
    def __init__(self):
        # In a real system, these rules could be loaded from a config file.
        self.priority_rules = {
            "urgency_keywords": {"urgent": 10, "critical": 15, "fix": 8},
            "impact_keywords": {"security": 20, "database": 12, "ui": 5},
            "complexity_modifiers": {"simple": -2, "complex": 5, "refactor": 7}
        }
        logger.info("PriorityManager initialized with default rules.")

    def calculate_priority(self, task: Dict) -> int:
        """
        Calculates a priority score for a given task.

        Args:
            task: A dictionary representing the task, must contain a 'description'.

        Returns:
            An integer priority score. Higher is more important.
        """
        base_priority = 5  # Default priority for any task
        description = task.get("description", "").lower()

        if not description:
            return base_priority

        # Urgency score
        for keyword, score in self.priority_rules["urgency_keywords"].items():
            if keyword in description:
                base_priority += score

        # Impact score
        for keyword, score in self.priority_rules["impact_keywords"].items():
            if keyword in description:
                base_priority += score

        # Complexity score
        for keyword, score in self.priority_rules["complexity_modifiers"].items():
            if keyword in description:
                base_priority += score

        # Ensure priority is within a reasonable range (e.g., 1 to 100)
        final_priority = max(1, min(100, base_priority))

        logger.debug(f"Calculated priority {final_priority} for task: {description[:50]}...")
        return final_priority
