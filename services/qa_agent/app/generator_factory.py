import logging
from typing import Optional

from .unit_test_generator import AbstractTestGenerator, PythonUnitTestGenerator
# Placeholders for future generators
# from .integration_test_generator import PythonIntegrationTestGenerator
# from .performance_test_generator import PythonPerformanceTestGenerator

logger = logging.getLogger(__name__)

class TestGeneratorFactory:
    """
    A factory for creating test generator instances based on language and test type.
    # TODO: This factory is incomplete. It should be expanded with generators
    # for other languages (like Javascript) and other test types (integration, etc.).
    """
    def __init__(self):
        self._generators = {
            "python": {
                "unit": PythonUnitTestGenerator,
                # "integration": PythonIntegrationTestGenerator, # Example for future
                # "performance": PythonPerformanceTestGenerator, # Example for future
            },
            "javascript": {
                # "unit": JavascriptUnitTestGenerator # Example for future
            }
        }
        logger.info("TestGeneratorFactory initialized.")

    def get_generator(self, language: str, test_type: str) -> Optional[AbstractTestGenerator]:
        """
        Gets a test generator instance for the specified language and test type.

        Args:
            language: The programming language (e.g., 'python').
            test_type: The type of test to generate (e.g., 'unit', 'integration').

        Returns:
            An instance of a test generator, or None if no suitable generator is found.
        """
        language = language.lower()
        test_type = test_type.lower()

        lang_generators = self._generators.get(language)
        if not lang_generators:
            logger.warning(f"No test generators found for language: {language}")
            return None

        generator_class = lang_generators.get(test_type)
        if not generator_class:
            logger.warning(f"No '{test_type}' test generator found for language: {language}")
            return None

        logger.info(f"Providing '{test_type}' test generator for '{language}'.")
        return generator_class()
