import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class DesignPatternCatalog:
    """
    A catalog of software design patterns.
    Provides information and suggestions about design patterns.
    """
    def __init__(self):
        self._catalog = self._load_patterns()
        logger.info("DesignPatternCatalog initialized.")

    def _load_patterns(self) -> Dict:
        """
        Loads the design patterns into memory.
        In a real system, this could come from a database or a config file.
        """
        return {
            "Singleton": {
                "type": "Creational",
                "description": "Ensures a class has only one instance and provides a global point of access to it.",
                "keywords": ["single instance", "global access", "shared resource", "database connection"],
                "use_case": "Use when exactly one object is needed to coordinate actions across the system, like a database connection pool or a logger."
            },
            "Factory Method": {
                "type": "Creational",
                "description": "Defines an interface for creating an object, but lets subclasses alter the type of objects that will be created.",
                "keywords": ["create object", "subclass decision", "flexible instantiation"],
                "use_case": "Use when a class cannot anticipate the class of objects it must create, or when you want to provide users of your library or framework with a way to extend its internal components."
            },
            "Observer": {
                "type": "Behavioral",
                "description": "Defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.",
                "keywords": ["notify", "subscribe", "event handling", "update dependents"],
                "use_case": "Use when changes to the state of one object may require changing other objects, and the actual set of objects is unknown beforehand or changes dynamically."
            },
            "Facade": {
                "type": "Structural",
                "description": "Provides a simplified interface to a library, a framework, or any other complex set of classes.",
                "keywords": ["simplified interface", "hide complexity", "subsystem wrapper"],
                "use_case": "Use when you need to have a limited but straightforward interface to a complex subsystem. It's good for providing a single entry point to a group of classes."
            }
        }

    def get_pattern(self, name: str) -> Dict:
        """Retrieves details for a specific design pattern."""
        return self._catalog.get(name)

    def suggest_patterns(self, requirement_description: str) -> List[Dict]:
        """
        Suggests relevant design patterns based on keywords in a description.
        """
        suggestions = []
        lower_description = requirement_description.lower()

        for name, details in self._catalog.items():
            for keyword in details["keywords"]:
                if keyword in lower_description:
                    suggestions.append({
                        "pattern_name": name,
                        "reason": f"Requirement mentions '{keyword}'.",
                        "details": details
                    })
                    break # Move to the next pattern once a keyword is found

        logger.info(f"Suggested {len(suggestions)} design patterns for the requirement.")
        return suggestions
