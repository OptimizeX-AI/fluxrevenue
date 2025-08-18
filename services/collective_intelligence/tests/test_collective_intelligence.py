import pytest
from unittest.mock import AsyncMock, MagicMock
from ..consensus_system import DistributedConsensusSystem
from ..negotiation_system import MultiAgentNegotiationSystem
from ..models import Proposal, Resource, Allocation, AllocationResult, ConsensusResult

# --- Tests for DistributedConsensusSystem ---

@pytest.fixture
def consensus_system():
    """Provides a DistributedConsensusSystem with mocked components."""
    system = DistributedConsensusSystem()
    system._select_consensus_protocol = MagicMock()
    system._collect_opinions = AsyncMock(return_value={"agent_1": "agree"})
    system.voting_system.tally_votes = MagicMock(return_value="agree")
    return system

@pytest.mark.asyncio
async def test_achieve_group_decision_orchestration(consensus_system):
    """
    Tests that achieve_group_decision calls its components in the correct order.
    """
    proposal = Proposal(proposal_id="prop1", description="test proposal", proposed_by="system")
    await consensus_system.achieve_group_decision(agents=[1, 2], proposal=proposal)

    consensus_system._select_consensus_protocol.assert_called_once()
    consensus_system._collect_opinions.assert_called_once()
    consensus_system.voting_system.tally_votes.assert_called_once()

# --- Tests for MultiAgentNegotiationSystem ---

@pytest.fixture
def negotiation_system():
    """Provides a MultiAgentNegotiationSystem with mocked components."""
    system = MultiAgentNegotiationSystem()
    system._calculate_utilities = AsyncMock(return_value={})
    # Mock the auction protocol to return a fixed allocation
    system.negotiation_protocols["auction"].run_auction = AsyncMock(
        return_value={"res1": "agent1"}
    )
    return system

@pytest.mark.asyncio
async def test_negotiate_resource_allocation_orchestration(negotiation_system):
    """
    Tests that negotiate_resource_allocation calls its components correctly.
    """
    agents = ["agent1"]
    resources = [Resource(resource_id="res1", resource_type="cpu")]

    result = await negotiation_system.negotiate_resource_allocation(agents, resources)

    negotiation_system._calculate_utilities.assert_called_once()
    negotiation_system.negotiation_protocols["auction"].run_auction.assert_called_once()
    assert result.allocation.allocation_map["res1"] == "agent1"
