import pytest
from unittest.mock import AsyncMock, MagicMock
from ..emergence_engine import EmergenceEngine
from ..self_organization import SelfOrganizationSystem
from ..models import AgentNetwork, EmergentPattern, ReorganizationProposal

# --- Tests for EmergenceEngine ---

@pytest.fixture
def emergence_engine():
    """Provides an EmergenceEngine instance with mocked components."""
    engine = EmergenceEngine()
    engine.interaction_rules.setup_basic_rules = AsyncMock()
    engine._observe_interactions = AsyncMock(return_value=[{}] * 11) # Mock enough interactions to trigger detection
    engine.emergence_detector.detect_patterns = AsyncMock(return_value=[EmergentPattern(pattern_id="p1", description="d1", involved_agents=[], utility_score=0.9)])
    engine._evaluate_pattern_utility = AsyncMock(return_value=0.9)
    engine.adaptation_engine.create_behavior_from_pattern = AsyncMock(return_value={"id": "b1"})
    engine.adaptation_engine.integrate_new_behavior = AsyncMock()
    engine.self_organization.organize_network = AsyncMock()
    return engine

@pytest.mark.asyncio
async def test_enable_emergent_behaviors_orchestration(emergence_engine):
    """
    Tests that enable_emergent_behaviors calls its components in the correct order.
    """
    network = AgentNetwork(agent_ids=["a1"], connections={})
    await emergence_engine.enable_emergent_behaviors(network)

    emergence_engine.interaction_rules.setup_basic_rules.assert_called_once_with(network)
    emergence_engine._observe_interactions.assert_called_once_with(network)
    emergence_engine.emergence_detector.detect_patterns.assert_called_once()
    emergence_engine._evaluate_pattern_utility.assert_called_once()
    emergence_engine.adaptation_engine.create_behavior_from_pattern.assert_called_once()
    emergence_engine.adaptation_engine.integrate_new_behavior.assert_called_once()
    emergence_engine.self_organization.organize_network.assert_called_once_with(network)

# --- Tests for SelfOrganizationSystem ---

@pytest.fixture
def self_organization_system():
    """Provides a SelfOrganizationSystem instance with mocked components."""
    system = SelfOrganizationSystem()
    system._analyze_current_structure = AsyncMock(return_value={})
    system._identify_inefficiencies = AsyncMock(return_value=["inefficiency1"])
    system.structure_optimizer.propose_reorganizations = AsyncMock(return_value=[ReorganizationProposal(proposal_id="p1", description="d1", impact_score=0.9, changes=[])])
    system._implement_reorganization = AsyncMock()
    system.role_assigner.assign_dynamic_roles = AsyncMock()
    return system

@pytest.mark.asyncio
async def test_organize_network_orchestration(self_organization_system):
    """
    Tests that organize_network calls its components in the correct order.
    """
    network = AgentNetwork(agent_ids=["a1"], connections={})
    await self_organization_system.organize_network(network)

    self_organization_system._analyze_current_structure.assert_called_once_with(network)
    self_organization_system._identify_inefficiencies.assert_called_once()
    self_organization_system.structure_optimizer.propose_reorganizations.assert_called_once()
    self_organization_system._implement_reorganization.assert_called_once()
    self_organization_system.role_assigner.assign_dynamic_roles.assert_called_once_with(network)
