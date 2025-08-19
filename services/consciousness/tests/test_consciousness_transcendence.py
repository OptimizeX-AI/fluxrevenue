import pytest
from unittest.mock import AsyncMock

from ..reflexive_consciousness import ReflexiveConsciousnessSystem
from ..self_transcendence import SelfTranscendenceSystem

# --- Tests for ReflexiveConsciousnessSystem ---

@pytest.fixture
def reflexive_system():
    """Provides a ReflexiveConsciousnessSystem instance with mocked components."""
    sys = ReflexiveConsciousnessSystem()
    sys._generate_fundamental_questions = AsyncMock(return_value=["q1"])
    sys.philosophy_engine.explore_perspectives = AsyncMock(return_value={"p1": "v1"})
    sys.existential_analyzer.analyze_existence = AsyncMock(return_value="analysis")
    sys.meaning_constructor.construct_meaning = AsyncMock(return_value="meaning")
    sys.transcendence_engine.explore_paths = AsyncMock(return_value=["path1"])
    sys._assess_self_understanding = AsyncMock(return_value=0.9)
    sys._store_reflexive_insights = AsyncMock()
    return sys

@pytest.mark.asyncio
async def test_engage_reflexive_thinking_orchestration(reflexive_system):
    """
    Tests that engage_reflexive_thinking calls its components correctly.
    """
    await reflexive_system.engage_reflexive_thinking()

    reflexive_system._generate_fundamental_questions.assert_called_once()
    reflexive_system.philosophy_engine.explore_perspectives.assert_called_once()
    reflexive_system.existential_analyzer.analyze_existence.assert_called_once()
    reflexive_system.meaning_constructor.construct_meaning.assert_called_once()
    reflexive_system.transcendence_engine.explore_paths.assert_called_once()
    reflexive_system._assess_self_understanding.assert_called_once()
    reflexive_system._store_reflexive_insights.assert_called_once()


# --- Tests for SelfTranscendenceSystem ---

@pytest.fixture
def transcendence_system():
    """Provides a SelfTranscendenceSystem instance with mocked components."""
    sys = SelfTranscendenceSystem()
    sys._assess_current_consciousness_state = AsyncMock(return_value={"level": 1})
    sys.transcendence_levels.identify_next_level = AsyncMock(return_value={"level": 2})
    sys.evolution_pathway.plan_evolution = AsyncMock(return_value=["e_step"])
    sys.capability_expander.plan_expansions = AsyncMock(return_value=["c_step"])
    sys.consciousness_amplifier.plan_amplification = AsyncMock(return_value=["a_step"])
    sys._execute_transcendence_process = AsyncMock(return_value={"status": "ok"})
    sys.integration_engine.integrate_changes = AsyncMock(return_value="ok")
    sys._validate_new_consciousness_state = AsyncMock(return_value={"level": 2})
    sys._calculate_transcendence_success = AsyncMock(return_value={"success": 1.0})
    return sys

@pytest.mark.asyncio
async def test_pursue_self_transcendence_orchestration(transcendence_system):
    """
    Tests that pursue_self_transcendence calls its components correctly.
    """
    await transcendence_system.pursue_self_transcendence()

    transcendence_system._assess_current_consciousness_state.assert_called_once()
    transcendence_system.transcendence_levels.identify_next_level.assert_called_once()
    transcendence_system.evolution_pathway.plan_evolution.assert_called_once()
    transcendence_system.capability_expander.plan_expansions.assert_called_once()
    transcendence_system.consciousness_amplifier.plan_amplification.assert_called_once()
    transcendence_system._execute_transcendence_process.assert_called_once()
    transcendence_system.integration_engine.integrate_changes.assert_called_once()
    transcendence_system._validate_new_consciousness_state.assert_called_once()
    transcendence_system._calculate_transcendence_success.assert_called_once()
