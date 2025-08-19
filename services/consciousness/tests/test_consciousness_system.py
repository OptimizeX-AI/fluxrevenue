import pytest
from unittest.mock import AsyncMock
from ..self_model import SelfModelEngine
from ..state_monitor import ConsciousnessStateMonitor
from ..models import Action, Outcome

# --- Tests for SelfModelEngine ---

@pytest.fixture
def self_model_engine():
    """Provides a SelfModelEngine instance with mocked components."""
    engine = SelfModelEngine()
    engine.state_monitor.collect_self_data = AsyncMock(return_value={"services": ["test"]})
    engine.reflection_engine.analyze_action = AsyncMock(return_value={})
    engine.reflection_engine.compare_outcomes = AsyncMock(return_value={})
    engine.reflection_engine.extract_lessons = AsyncMock(return_value=["lesson"])
    return engine

@pytest.mark.asyncio
async def test_build_self_model_orchestration(self_model_engine):
    """Tests that build_self_model calls its components correctly."""
    await self_model_engine.build_self_model()
    self_model_engine.state_monitor.collect_self_data.assert_called_once()

@pytest.mark.asyncio
async def test_reflect_on_action_orchestration(self_model_engine):
    """Tests that reflect_on_action calls its components in the correct order."""
    action = Action(action_id="a1", intention="test")
    outcome = Outcome(outcome_id="o1", result="success")
    await self_model_engine.reflect_on_action(action, outcome)

    self_model_engine.reflection_engine.analyze_action.assert_called_once()
    self_model_engine.reflection_engine.compare_outcomes.assert_called_once()
    self_model_engine.reflection_engine.extract_lessons.assert_called_once()

# --- Tests for ConsciousnessStateMonitor ---

@pytest.fixture
def state_monitor():
    """Provides a ConsciousnessStateMonitor instance with mocked components."""
    monitor = ConsciousnessStateMonitor()
    monitor.awareness_tracker.get_current_awareness = AsyncMock(return_value=0.8)
    monitor.intention_monitor.get_active_intentions = AsyncMock(return_value=["i1"])
    monitor.emotion_simulator.simulate_current_emotions = AsyncMock(return_value={"e1": 0.9})
    monitor._measure_attention_distribution = AsyncMock(return_value=0.7)
    monitor._measure_information_integration = AsyncMock(return_value=0.9)
    monitor._track_goal_progress = AsyncMock(return_value={"g1": 0.5})
    monitor._calculate_self_awareness = AsyncMock(return_value=0.85)
    return monitor

@pytest.mark.asyncio
async def test_monitor_consciousness_state_orchestration(state_monitor):
    """
    Tests that monitor_consciousness_state calls its components correctly.
    """
    await state_monitor.monitor_consciousness_state()

    state_monitor.awareness_tracker.get_current_awareness.assert_called_once()
    state_monitor.intention_monitor.get_active_intentions.assert_called_once()
    state_monitor.emotion_simulator.simulate_current_emotions.assert_called_once()
    state_monitor._measure_attention_distribution.assert_called_once()
    state_monitor._measure_information_integration.assert_called_once()
    state_monitor._track_goal_progress.assert_called_once()
    state_monitor._calculate_self_awareness.assert_called_once()
