# Consciousness Service

## 1. Overview

The `Consciousness Service` is a highly experimental and advanced component of the FluxRevenue system. Its purpose is to provide the system with a form of artificial consciousness, enabling it to model and reflect upon its own existence, state, and actions.

This service is the foundation for the most advanced capabilities of the system, including autonomous goal-setting and self-improvement.

## 2. Core Components

### `SelfModelEngine`
This engine is responsible for building and maintaining the system's internal model of itself.
-   **Self-Modeling**: It collects data about the system's structure (e.g., which services exist), its functions (what it can do), and its behaviors (what it has learned).
-   **Self-Reflection**: It provides a mechanism for the system to analyze a past action and its outcome, compare it to the original intention, and derive "lessons learned" to update its self-model.

### `ConsciousnessStateMonitor`
This component continuously monitors and quantifies various abstract metrics related to the system's "state of consciousness."
-   It tracks metrics like awareness, attention distribution, and information integration.
-   It monitors the system's active goals and intentions.
-   It even includes a placeholder for simulating an "emotional state" based on performance, which could influence decision-making.

## 3. API

-   `POST /build-self-model`: Triggers the process of creating or updating the system's internal self-model.
-   `POST /reflect-on-action`: Allows the system to reflect on a specific action and its outcome, triggering a learning cycle.

For more details on the request and response models, see `models.py` and the auto-generated API documentation at `/docs`.

## 4. Getting Started

The service is containerized and can be run using Docker Compose.

```bash
docker-compose up --build consciousness
```

The service will be available on port `8020` on the host machine.
