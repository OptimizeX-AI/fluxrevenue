import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class CriticalAnalysis:
    """
    A generic class for agents to critically analyze their own output
    before considering a task complete.
    """
    def __init__(self, agent_name: str, agent_type: str):
        self.agent_name = agent_name
        self.agent_type = agent_type
        # Rules can be loaded from a config file in a real system
        self.validation_rules = self._load_validation_rules()
        logger.info(f"CriticalAnalysis module initialized for {self.agent_name}")

    def _load_validation_rules(self) -> Dict:
        """
        Loads validation rules specific to the agent type.
        This should be overridden by each agent's specific implementation.
        """
        # Generic rules
        base_rules = {
            "output_must_be_dict": lambda output: isinstance(output, dict),
            "output_must_not_be_empty": lambda output: bool(output)
        }
        return base_rules

    def analyze_output(self, task_output: List[Dict]) -> Dict[str, Any]:
        """
        Analyzes the output of a completed task against a set of rules.

        Args:
            task_output: The list of artifacts produced by the agent for the task.

        Returns:
            A dictionary containing the analysis result, with keys like 'is_valid'
            and 'feedback'.
        """
        if not isinstance(task_output, list) or not task_output:
            return {"is_valid": False, "feedback": "Task output must be a non-empty list of artifacts."}

        # For this generic analyzer, we'll analyze the first artifact
        output_to_check = task_output[0]

        all_feedback = []
        is_fully_valid = True

        for rule_name, validation_func in self.validation_rules.items():
            try:
                if not validation_func(output_to_check):
                    is_fully_valid = False
                    feedback = f"Validation failed for rule '{rule_name}'."
                    all_feedback.append(feedback)
                    logger.warning(f"Agent '{self.agent_name}' output failed validation: {feedback}")
            except Exception as e:
                is_fully_valid = False
                feedback = f"Error during validation for rule '{rule_name}': {e}"
                all_feedback.append(feedback)
                logger.error(f"Agent '{self.agent_name}' output validation error: {feedback}", exc_info=True)

        if is_fully_valid:
            logger.info(f"Agent '{self.agent_name}' output passed critical analysis.")
            return {"is_valid": True, "feedback": "Output is valid."}
        else:
            return {"is_valid": False, "feedback": " ".join(all_feedback)}

    def suggest_improvements(self, failed_output: Dict, feedback: str) -> Dict:
        """
        Suggests improvements based on the analysis feedback.
        # TODO: This is a placeholder. A real implementation would use an LLM
        # or a rule-based system to provide more concrete, actionable suggestions.
        """
        suggestion = {
            "suggestion": "Review the output based on the feedback provided.",
            "original_output": failed_output,
            "feedback": feedback
        }
        return suggestion
