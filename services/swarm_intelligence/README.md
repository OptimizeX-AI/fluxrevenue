# Swarm Intelligence Service

## 1. Overview

The `Swarm Intelligence` service provides a framework for solving complex optimization problems using algorithms inspired by nature, specifically Ant Colony Optimization (ACO). It allows a "colony" of specialized agents to collaboratively explore a solution space and converge on an optimal solution that would be difficult for a single agent to find.

## 2. Core Components

### `AgentColony`
This is the main orchestrator. It manages the lifecycle of an optimization process:
1.  **Initialization**: Creates a colony of specialized agents.
2.  **Exploration**: In each iteration, every agent explores a potential solution path. The path an agent chooses is probabilistically influenced by the strength of digital pheromone trails.
3.  **Evaluation**: The quality of each agent's solution is evaluated.
4.  **Pheromone Update**: Agents "deposit" digital pheromones on the paths they traveled, with the strength of the pheromone being proportional to the quality of their solution. Good paths are reinforced.
5.  **Evaporation**: Over time, all pheromone trails are slightly reduced ("evaporated"). This prevents the colony from converging too quickly on a suboptimal solution and encourages continued exploration.
6.  **Synthesis**: After a set number of iterations or when the solutions converge, the best overall solution found by the colony is synthesized and returned.

### `DigitalPheromoneSystem`
This component manages the state of the pheromone trails, handling the logic for deposits, evaporation, and calculating path probabilities.

## 3. API

-   **Endpoint**: `POST /solve-problem`
-   **Description**: Receives a `ComplexProblem` object and returns an `OptimalSolution` object found by the agent colony.
-   **See `models.py` for the detailed schemas.**

For more details, see the auto-generated API documentation at `/docs`.

## 4. Getting Started

The service is containerized and can be run using Docker Compose.

```bash
docker-compose up --build swarm_intelligence
```

The service will be available on port `8017` on the host machine.
