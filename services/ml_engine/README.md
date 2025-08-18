# ML Engine Service

## 1. Overview

The `ML Engine` is a dedicated service within the FluxRevenue system responsible for all Machine Learning and Deep Learning operations. It provides a comprehensive framework for training, optimizing, serving, and managing the lifecycle of custom ML models.

This service is the foundation for the advanced intelligence capabilities planned in ETAPA 11, moving FluxRevenue beyond heuristic-based logic to data-driven, learned decision-making.

## 2. Architecture

The service is built around the `MLFramework`, which orchestrates several key components:

-   **Model Registry**: Manages the storage and versioning of trained models.
-   **Training Pipeline**: Handles the end-to-end process of training a model with a given dataset.
-   **Inference Engine**: Provides an interface for running predictions using a registered model.
-   **Model Optimizer**: Contains tools for optimizing trained models (e.g., via pruning or quantization) for better performance.
-   **Continuous Learning System**: Manages the feedback loop for automatically retraining and updating models based on new data and performance metrics.

## 3. Implemented Models

### `DecisionNeuralNetwork`
-   **Location**: `models/decision_neural_network.py`
-   **Description**: A flexible, feed-forward neural network built with PyTorch. Its architecture (number of layers and neurons) can be customized upon instantiation, making it suitable for a variety of classification and decision-making tasks.

## 4. API

The service exposes an API for interacting with the ML framework.

-   **Endpoint**: `POST /train/decision_model`
-   **Description**: An endpoint to trigger the training process for a new decision model.
-   **Request Body**: A JSON object containing the training data.
-   **Response**: A confirmation that the training process has been initiated.

For more details, see the auto-generated API documentation at `/docs`.

## 5. Getting Started

The service is containerized and can be run using Docker Compose.

```bash
# To run the ML Engine and its dependencies
docker-compose up --build ml_engine
```

The service will be available on port `8014` on the host machine.
