import spacy
from spacy.matcher import Matcher
import logging

logger = logging.getLogger(__name__)

class NLPExtractor:
    """
    Extracts key entities from project requirements using spaCy's Matcher.
    This provides a more robust way to identify concepts than simple keyword searches.
    """
    def __init__(self):
        """Initializes the extractor, the spaCy model, and the Matcher."""
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("Spacy model 'en_core_web_sm' not found. Downloading...")
            from spacy.cli import download
            download("en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")

        self.matcher = Matcher(self.nlp.vocab)
        self._setup_patterns()

    def _setup_patterns(self):
        """Defines the patterns for entity matching. This can be expanded significantly."""
        # Patterns are lists of dictionaries, where each dict describes a token.
        # See spaCy documentation for more complex patterns.

        # Technology Patterns (e.g., frameworks, databases)
        tech_patterns = {
            "react": [[{"LOWER": "react"}]],
            "vue": [[{"LOWER": "vue"}]],
            "fastapi": [[{"LOWER": "fastapi"}]],
            "django": [[{"LOWER": "django"}]],
            "postgresql": [[{"LOWER": "postgresql"}], [{"LOWER": "postgres"}]],
            "mongodb": [[{"LOWER": "mongodb"}]],
        }

        # Architectural Patterns (e.g., API, Microservice)
        arch_patterns = {
            "api": [[{"LOWER": "api"}]],
            "rest_api": [[{"LOWER": "rest"}, {"LOWER": "api"}]],
            "microservice": [[{"LOWER": "microservice"}]],
            "frontend": [[{"LOWER": "frontend"}]],
            "backend": [[{"LOWER": "backend"}]],
        }

        # Feature Patterns (e.g., auth, payments)
        feature_patterns = {
            "authentication": [[{"LOWER": "auth"}] , [{"LOWER": "authentication"}]],
            "payment": [[{"LOWER": "payment"}], [{"LOWER": "payments"}]],
            "jwt": [[{"LOWER": "jwt"}]],
        }

        # Add patterns to the matcher with a category prefix for easy identification
        for label, patterns in tech_patterns.items():
            self.matcher.add(f"TECH_{label.upper()}", patterns)

        for label, patterns in arch_patterns.items():
            self.matcher.add(f"ARCH_{label.upper()}", patterns)

        for label, patterns in feature_patterns.items():
            self.matcher.add(f"FEAT_{label.upper()}", patterns)

    def extract_entities(self, text: str) -> dict:
        """
        Processes a requirements text and extracts a dictionary of found entities.

        Args:
            text: The project requirements text.

        Returns:
            A dictionary with categorized entities.
        """
        doc = self.nlp(text.lower())
        matches = self.matcher(doc)

        entities = {
            "technologies": set(),
            "architectures": set(),
            "features": set()
        }

        for match_id, start, end in matches:
            rule_id_str = self.nlp.vocab.strings[match_id]
            category, label = rule_id_str.split('_', 1)
            label = label.lower()

            if category == "TECH":
                entities["technologies"].add(label)
            elif category == "ARCH":
                entities["architectures"].add(label)
            elif category == "FEAT":
                entities["features"].add(label)

        # Convert sets to lists for consistent output and JSON serialization
        result = {key: sorted(list(value)) for key, value in entities.items()}

        logger.info("Extracted entities from requirements.", extra={"props": result})
        return result
