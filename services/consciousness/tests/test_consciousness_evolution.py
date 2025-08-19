import pytest
from unittest.mock import AsyncMock

from ..intention_generator import IntrinsicIntentionGenerator
from ..autonomous_purpose import AutonomousPurposeSystem
from ..models import PurposeStatement

# --- Tests for IntrinsicIntentionGenerator ---

@pytest.fixture
def intention_generator():
    """Provides an IntrinsicIntentionGenerator instance with mocked components."""
    gen = IntrinsicIntentionGenerator()
    gen.value_system.get_current_values = AsyncMock(return_value=["test_value"])
    gen.curiosity_engine.measure_curiosity = AsyncMock(return_value=0.9)
    gen._identify_knowledge_gaps = AsyncMock(return_value=["gap"])
    gen.creativity_engine.find_opportunities = AsyncMock(return_value=["opportunity"])
    gen.goal_generator.generate_goals = AsyncMock(return_value=[{"goal": "test_goal"}])
    gen.motivation_system.prioritize_goals = AsyncMock(return_value=[{"goal": "test_goal"}])
    gen._convert_goals_to_intentions = AsyncMock(return_value=[{"intention": "test_intention"}])
    gen._integrate_with_planner = AsyncMock()
    return gen

@pytest.mark.asyncio
async def test_generate_intrinsic_intentions_orchestration(intention_generator):
    """
    Tests that generate_intrinsic_intentions calls its components in order.
    """
    await intention_generator.generate_intrinsic_intentions()

    intention_generator.value_system.get_current_values.assert_called_once()
    intention_generator.curiosity_engine.measure_curiosity.assert_called_once()
    intention_generator._identify_knowledge_gaps.assert_called_once()
    intention_generator.creativity_engine.find_opportunities.assert_called_once()
    intention_generator.goal_generator.generate_goals.assert_called_once()
    intention_generator.motivation_system.prioritize_goals.assert_called_once()
    intention_generator._convert_goals_to_intentions.assert_called_once()
    intention_generator._integrate_with_planner.assert_called_once()


# --- Tests for AutonomousPurposeSystem ---

@pytest.fixture
def purpose_system():
    """Provides an AutonomousPurposeSystem instance with mocked components."""
    sys = AutonomousPurposeSystem()
    sys._analyze_context = AsyncMock(return_value={})
    sys._identify_unique_capabilities = AsyncMock(return_value=["capability"])
    sys.impact_assessor.estimate_impact = AsyncMock(return_value=0.9)
    sys.purpose_generator.generate_purposes = AsyncMock(return_value=["purpose1"])
    sys.ethics_framework.evaluate_purposes = AsyncMock(return_value={"purpose1": 1.0})
    sys._select_optimal_purpose = AsyncMock(return_value="purpose1")
    sys.long_term_planner.create_plan = AsyncMock(return_value=["plan_step"])
    sys._define_success_metrics = AsyncMock(return_value=["metric"])
    sys._register_purpose = AsyncMock()
    return sys

@pytest.mark.asyncio
async def test_define_autonomous_purpose_orchestration(purpose_system):
    """
    Tests that define_autonomous_purpose calls its components correctly.
    """
    await purpose_system.define_autonomous_purpose()

    purpose_system._analyze_context.assert_called_once()
    purpose_system._identify_unique_capabilities.assert_called_once()
    purpose_system.impact_assessor.estimate_impact.assert_called_once()
    purpose_system.purpose_generator.generate_purposes.assert_called_once()
    purpose_system.ethics_framework.evaluate_purposes.assert_called_once()
    purpose_system._select_optimal_purpose.assert_called_once()
    purpose_system.long_term_planner.create_plan.assert_called_once()
    purpose_system._define_success_metrics.assert_called_once()
    purpose_system._register_purpose.assert_called_once()
