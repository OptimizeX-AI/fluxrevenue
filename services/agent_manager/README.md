# Agent Manager Service

## 1. Overview

The Agent Manager is the central "brain" of the FluxRevenue system. It is responsible for receiving high-level tasks, making strategic decisions about how to execute them, and allocating those tasks to the appropriate specialized agents (e.g., `developer_agent`, `qa_agent`).

## 2. Key Components

-   **Decision Engine**: The core logic unit that prioritizes tasks and allocates agents.
-   **Task Allocator**: A component responsible for selecting the best agent for a given task based on its capabilities and current status.
-   **Priority Manager**: A module that calculates the execution priority of tasks based on various factors.
-   **Learning Module**: Processes feedback from task outcomes (success/failure) to improve future decision-making.
-   **Fallback Handler**: Manages failures and determines remediation steps.

## 3. Performance Optimizations

To enhance performance and reduce latency, the `agent_manager` incorporates several optimization strategies:

### Decision Caching

-   **Component**: `performance/decision_cache.py`
-   **Description**: The `DecisionEngine` now uses a `DecisionCache` to store the results of agent allocation decisions for specific task descriptions. For recurring or similar tasks, this allows the engine to retrieve the allocation decision from the cache almost instantly, bypassing the more expensive allocation logic. This caching is handled by the common `CacheManager`, which uses both a local in-memory cache and a distributed Redis cache.
