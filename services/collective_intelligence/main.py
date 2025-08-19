from fastapi import FastAPI, HTTPException, Body
from typing import List, Any
from .models import Proposal, ConsensusResult, Resource, AllocationResult
from .consensus_system import DistributedConsensusSystem
from .negotiation_system import MultiAgentNegotiationSystem

app = FastAPI(
    title="Collective Intelligence Engine",
    description="Service for distributed consensus, negotiation, and other collective intelligence tasks.",
    version="1.0.0"
)

consensus_system = DistributedConsensusSystem()
negotiation_system = MultiAgentNegotiationSystem()

@app.post("/achieve-consensus", response_model=ConsensusResult)
async def achieve_consensus(agents: List[Any] = Body(...), proposal: Proposal = Body(...)):
    """
    Receives a list of agents and a proposal, and orchestrates a consensus process.
    """
    try:
        result = await consensus_system.achieve_group_decision(agents, proposal)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.post("/negotiate-resources", response_model=AllocationResult)
async def negotiate_resources(agents: List[Any] = Body(...), resources: List[Resource] = Body(...)):
    """
    Receives a list of agents and resources, and orchestrates a negotiation process.
    """
    try:
        result = await negotiation_system.negotiate_resource_allocation(agents, resources)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for the Collective Intelligence Engine.
    """
    return {"status": "ok"}
