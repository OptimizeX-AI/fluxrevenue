import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class CriticalAnalysis:
    """
    A specialized class for the Code Reviewer to critically analyze its own output.
    """
    def __init__(self, agent_name: str = "code_reviewer", agent_type: str = "reviewer"):
        self.agent_name = agent_name
        self.agent_type = agent_type
        self.validation_rules = self._load_validation_rules()
        logger.info(f"CriticalAnalysis module initialized for {self.agent_name}")

    def _load_validation_rules(self) -> Dict:
        """
        Loads validation rules specific to the Code Reviewer.
        A valid review artifact must have a 'status' and a 'summary'.
        """
        rules = {
            "output_must_be_dict": lambda output: isinstance(output, dict),
            "must_have_status_field": lambda output: "status" in output,
            "status_must_be_valid": lambda output: output.get("status") in ["APPROVED", "REJECTED"],
            "must_have_summary_field": lambda output: "summary" in output and isinstance(output["summary"], str) and output["summary"].strip() != "",
            "rejected_must_have_details": lambda output: "details" in output if output.get("status") == "REJECTED" else True,
        }
        return rules

    def analyze_output(self, task_output: List[Dict]) -> Dict[str, Any]:
        """
        Analyzes the review artifact against a set of rules.
        """
        if not isinstance(task_output, list) or not task_output:
            return {"is_valid": False, "feedback": "Task output must be a non-empty list of artifacts."}

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
        Suggests improvements for a failed review output.
        """
        suggestion = {
            "suggestion": "The generated review is invalid. Please ensure it has all required fields (status, summary, details for rejection) and try again.",
            "original_output": failed_output,
            "feedback": feedback
        }
        # In a more advanced system, this could try to auto-correct the output.
        return suggestion
