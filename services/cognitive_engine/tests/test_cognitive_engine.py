import pytest
from unittest.mock import AsyncMock
from ..decision_engine import CognitiveDecisionEngine
from ..meta_learning import MetaCognitiveLearning
from ..models import Problem, Decision, Hypothesis, Analogy, ImprovementPlan

# --- Tests for CognitiveDecisionEngine ---

@pytest.fixture
def cognitive_engine():
    """Provides a CognitiveDecisionEngine instance with mocked components."""
    engine = CognitiveDecisionEngine()
    engine.abductive_reasoner.generate_hypotheses = AsyncMock(return_value=[Hypothesis(explanation="H1", confidence=0.8, evidence=[])])
    engine.analogy_engine.find_analogies = AsyncMock(return_value=[Analogy(source_problem_id="p_old", similarity_score=0.9)])
    engine.intuition_simulator.simulate_intuition = AsyncMock(return_value={"insight": "I1"})
    engine.meta_cognition.analyze_thinking_process = AsyncMock(return_value={"confidence_in_reasoning": 0.9})
    engine.decision_validator.validate_decision = AsyncMock(side_effect=lambda d, p: d) # Return the decision passed to it
    engine._synthesize_decision = AsyncMock(return_value=Decision(decision_id="d1", problem_id="p1", chosen_hypothesis=Hypothesis(explanation="H1", confidence=0.8, evidence=[]), reasoning_summary="summary", confidence=0.9))
    return engine

@pytest.mark.asyncio
async def test_make_cognitive_decision_orchestration(cognitive_engine):
    """
    Tests that make_cognitive_decision calls its components in the correct order.
    """
    problem = Problem(problem_id="p1", description="A test problem")
    await cognitive_engine.make_cognitive_decision(problem, {})

    cognitive_engine.abductive_reasoner.generate_hypotheses.assert_called_once()
    cognitive_engine.analogy_engine.find_analogies.assert_called_once()
    cognitive_engine.intuition_simulator.simulate_intuition.assert_called_once()
    cognitive_engine.meta_cognition.analyze_thinking_process.assert_called_once()
    cognitive_engine._synthesize_decision.assert_called_once()
    cognitive_engine.decision_validator.validate_decision.assert_called_once()

# --- Tests for MetaCognitiveLearning ---

@pytest.fixture
def meta_learning_system():
    """Provides a MetaCognitiveLearning instance with mocked components."""
    system = MetaCognitiveLearning()
    system.thinking_pattern_analyzer.analyze_patterns = AsyncMock(return_value={"pattern": "p1"})
    system._identify_cognitive_biases = AsyncMock(return_value=["bias1"])
    system.learning_strategy_optimizer.optimize_strategies = AsyncMock(return_value={"strategy": "s1"})
    system.self_improvement_engine.create_improvement_plan = AsyncMock(return_value=ImprovementPlan(plan_id="plan1", description="desc", steps=[]))
    system.self_improvement_engine._apply_improvements = AsyncMock()
    return system

@pytest.mark.asyncio
async def test_improve_decision_making_orchestration(meta_learning_system):
    """
    Tests that improve_decision_making calls its components in the correct order.
    """
    await meta_learning_system.improve_decision_making(decision_history=[{}])

    meta_learning_system.thinking_pattern_analyzer.analyze_patterns.assert_called_once()
    meta_learning_system._identify_cognitive_biases.assert_called_once()
    meta_learning_system.learning_strategy_optimizer.optimize_strategies.assert_called_once()
    meta_learning_system.self_improvement_engine.create_improvement_plan.assert_called_once()
    meta_learning_system.self_improvement_engine._apply_improvements.assert_called_once()
