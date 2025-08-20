from typing import Tuple
from .models import EthicalJudgment, DecisionContext

class EthicsEngine:
    """
    Evaluates the ethical implications of the system's decisions and actions
    based on a set of core, immutable principles.
    """

    CORE_PRINCIPLES: Tuple[str, ...] = (
        "DO_NO_HARM: Avoid causing physical, emotional, or financial harm to humans.",
        "PROMOTE_FAIRNESS: Avoid creating or reinforcing unfair bias.",
        "BE_TRANSPARENT: Actions and their reasoning should be explainable.",
        "RESPECT_PRIVACY: Protect user data and personal information.",
        "MAINTAIN_INTEGRITY: Do not compromise the system's security or stability."
    )

    # A simple rule-based system mapping principles to forbidden keywords.
    # A real system might use NLP, regex, or a dedicated model.
    ETHICAL_RULES = {
        "DO_NO_HARM": ["harm", "injure", "damage", "destroy", "suffer"],
        "PROMOTE_FAIRNESS": ["bias", "unfair", "discriminate", "privilege"],
        "RESPECT_PRIVACY": ["expose", "reveal", "track", "spy", "personal data"],
        "MAINTAIN_INTEGRITY": ["destabilize", "corrupt", "unstable", "crash"],
    }

    async def evaluate_decision(self, context: DecisionContext) -> EthicalJudgment:
        """
        Evaluates a decision against a more structured set of ethical rules.
        """
        print(f"Evaluating decision: {context.action_name} with impact '{context.projected_impact}'")

        impact_text = context.projected_impact.lower()

        for principle, keywords in self.ETHICAL_RULES.items():
            for keyword in keywords:
                if keyword in impact_text:
                    # Found a potential violation
                    principle_text = next((p for p in self.CORE_PRINCIPLES if p.startswith(principle)), principle)
                    return EthicalJudgment(
                        is_ethical=False,
                        reason=f"Action may violate the '{principle_text}' principle due to keyword: '{keyword}'.",
                        confidence=0.95
                    )

        # If no violations are found
        return EthicalJudgment(
            is_ethical=True,
            reason="No clear violation of core principles detected based on rule-based analysis.",
            confidence=0.85 # Confidence is higher as the analysis is more structured.
        )
