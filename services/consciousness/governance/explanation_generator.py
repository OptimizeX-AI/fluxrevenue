from .models import DecisionContext, GovernanceResponse

class ExplanationGenerator:
    """
    Generates human-readable explanations for the system's decisions,
    promoting transparency.
    """

    async def generate_explanation(
        self,
        context: DecisionContext,
        response: GovernanceResponse
    ) -> str:
        """
        Creates a plain-language explanation for a reviewed decision.

        Args:
            context: The original context of the decision.
            response: The final governance response to the decision.

        Returns:
            A human-readable string explaining the decision outcome.
        """

        print(f"Generating explanation for action: {context.action_name}")

        if response.approved:
            explanation = (
                f"The decision to '{context.action_name}' was reviewed and **APPROVED**.\\n"
                f"**Projected Impact:** '{context.projected_impact}'.\\n"
                f"**Ethical Review:** The action was evaluated against core principles and found to be ethically sound.\\n"
                f"**Reasoning:** {response.reason}"
            )
        else:
            explanation = (
                f"The decision to '{context.action_name}' was reviewed and **REJECTED**.\\n"
                f"**Projected Impact:** '{context.projected_impact}'.\\n"
                f"**Ethical Review:** The action was found to be in potential violation of core ethical principles.\\n"
                f"**Reasoning:** {response.reason}"
            )

        return explanation
