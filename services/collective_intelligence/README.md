# Collective Intelligence Service

## 1. Overview

The `Collective Intelligence` service provides the frameworks and protocols necessary for groups of agents to make decisions and allocate resources without a central authority. This service is a key component in enabling emergent, decentralized, and robust behavior across the entire FluxRevenue system.

## 2. Core Components

### `DistributedConsensusSystem`
This system allows a group of agents to come to a collective agreement on a given proposal. It is designed to be a plug-and-play system for various consensus algorithms. The initial skeleton includes a mock implementation of a Raft-like process.

### `MultiAgentNegotiationSystem`
This system enables agents to negotiate over the allocation of shared resources. It is designed to support different negotiation protocols (e.g., auctions, bargaining) to find allocations that are both efficient and fair.

## 3. API

The service exposes endpoints to trigger these collective intelligence processes:

-   `POST /achieve-consensus`: Initiates a consensus process for a group of agents regarding a specific proposal.
-   `POST /negotiate-resources`: Initiates a negotiation process among a group of agents for a set of resources.

For more details on the request and response models, see `models.py` and the auto-generated API documentation at `/docs`.

## 4. Getting Started

The service is containerized and can be run using Docker Compose.

```bash
docker-compose up --build collective_intelligence
```

The service will be available on port `8018` on the host machine.
