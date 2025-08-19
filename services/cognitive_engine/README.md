# Cognitive Engine Service

## 1. Overview

The `Cognitive Engine` is a highly advanced service that aims to replicate complex human cognitive processes for decision-making. It moves beyond simple rule-based or predictive models to incorporate reasoning, analogy, and even simulated "intuition".

This service represents the pinnacle of the FluxRevenue system's intelligence, designed to tackle ambiguous, complex problems that do not have a clear, optimal solution.

## 2. Architecture

The service is composed of two main systems:

### `CognitiveDecisionEngine`
This engine is responsible for making a single, complex decision. It orchestrates a pipeline of cognitive function simulators:
-   **Abductive Reasoner**: Infers the most plausible explanations or hypotheses for a given problem.
-   **Analogy Engine**: Searches past experiences (problems) to find relevant analogies that can inform the current decision.
-   **Intuition Simulator**: Uses heuristics and pattern-matching for rapid, "gut-feeling" insights.
-   **Meta-Cognition**: "Thinks about the thinking process" itself, analyzing the hypotheses and insights to gauge confidence and identify potential flaws in its own reasoning.
-   **Decision Validator**: Performs a final check on the synthesized decision before it is actioned.

### `MetaCognitiveLearning`
This system is responsible for improving the `CognitiveDecisionEngine` over time.
-   It analyzes the history of past decisions to identify recurring patterns, biases, or flaws in the engine's reasoning process.
-   It then generates and applies a self-improvement plan, for example, by adjusting the weights given to different cognitive functions.

## 3. API

-   **Endpoint**: `POST /make-cognitive-decision`
-   **Description**: Receives a `Problem` object and returns a `Decision` object, representing the outcome of the cognitive process.
-   **See `models.py` for the detailed schemas.**

For more details, see the auto-generated API documentation at `/docs`.

## 4. Getting Started

The service is containerized and can be run using Docker Compose.

```bash
docker-compose up --build cognitive_engine
```

The service will be available on port `8016` on the host machine.
