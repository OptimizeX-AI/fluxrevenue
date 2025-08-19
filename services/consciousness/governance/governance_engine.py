from .models import DecisionContext, GovernanceResponse
from .ethics_engine import EthicsEngine

class GovernanceEngine:
    """
    Acts as the final gatekeeper for conscious decisions, ensuring they align
    with ethical principles before being executed.
    """

    def __init__(self):
        self.ethics_engine = EthicsEngine()

    async def review_and_approve(self, context: DecisionContext) -> GovernanceResponse:
        """
        Reviews a decision context, evaluates it for ethical compliance,
        and returns an approval or rejection.
        """
        print(f"GovernanceEngine reviewing action: {context.action_name}")

        # 1. Evaluate the decision using the EthicsEngine
        ethical_judgment = await self.ethics_engine.evaluate_decision(context)

        # 2. Make a final governance decision based on the ethical judgment
        if not ethical_judgment.is_ethical:
            rejection_reason = (
                f"Action REJECTED by GovernanceEngine due to ethical concerns. "
                f"Reason: {ethical_judgment.reason}"
            )
            print(rejection_reason)
            return GovernanceResponse(
                approved=False,
                reason=rejection_reason
            )

        approval_reason = (
            "Action APPROVED by GovernanceEngine. "
            f"Ethical check passed (Confidence: {ethical_judgment.confidence})."
        )
        print(approval_reason)
        return GovernanceResponse(
            approved=True,
            reason=approval_reason
        )
