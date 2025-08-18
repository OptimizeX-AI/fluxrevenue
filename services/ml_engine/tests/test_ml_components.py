import pytest
import torch
from unittest.mock import AsyncMock, patch
from ..models.decision_neural_network import DecisionNeuralNetwork
from ..ml_framework import MLFramework

# --- Tests for DecisionNeuralNetwork ---

def test_decision_neural_network_creation():
    """Tests that the neural network is created with the correct architecture."""
    input_dim = 10
    hidden_dims = [20, 30]
    output_dim = 5
    model = DecisionNeuralNetwork(input_dim, hidden_dims, output_dim)

    # Expected number of layers: 1 input linear, 1 input relu, 1 input dropout,
    # 1 hidden linear, 1 hidden relu, 1 hidden dropout, 1 output linear, 1 softmax
    # Total = 8 layers
    assert len(model.layers) == 8

    # Check layer types and dimensions
    assert isinstance(model.layers[0], torch.nn.Linear)
    assert model.layers[0].in_features == input_dim
    assert model.layers[0].out_features == hidden_dims[0]

    assert isinstance(model.layers[3], torch.nn.Linear)
    assert model.layers[3].in_features == hidden_dims[0]
    assert model.layers[3].out_features == hidden_dims[1]

    assert isinstance(model.layers[6], torch.nn.Linear)
    assert model.layers[6].in_features == hidden_dims[1]
    assert model.layers[6].out_features == output_dim

def test_decision_neural_network_forward_pass():
    """Tests that a forward pass executes correctly and returns the correct shape."""
    model = DecisionNeuralNetwork(input_dim=10, hidden_dims=[8], output_dim=3)
    # Create a dummy input tensor with batch size 4
    dummy_input = torch.randn(4, 10)
    output = model(dummy_input)

    assert output.shape == (4, 3)
    # Check that the output is a valid probability distribution (sums to 1)
    assert torch.allclose(torch.sum(output, dim=1), torch.tensor([1.0, 1.0, 1.0, 1.0]))

# --- Tests for MLFramework ---

@pytest.fixture
def ml_framework():
    """Provides an MLFramework instance with mocked components for tests."""
    framework = MLFramework()
    # Mock the async methods of the internal components
    framework.model_registry.register_model = AsyncMock()
    framework.training_pipeline.train = AsyncMock(return_value={"model_type": "TrainedDecisionNN"})
    framework.model_optimizer.optimize = AsyncMock(return_value={"model_type": "OptimizedDecisionNN"})
    framework._preprocess_training_data = AsyncMock(return_value={"processed": True})
    framework._create_decision_neural_network = AsyncMock(return_value={"model_type": "DecisionNN"})
    return framework

@pytest.mark.asyncio
async def test_train_decision_model_orchestration(ml_framework):
    """
    Tests that train_decision_model calls its components in the correct order.
    """
    dummy_training_data = {"features": [], "labels": []}
    await ml_framework.train_decision_model(dummy_training_data)

    # Verify that each step in the orchestration pipeline was called once
    ml_framework._preprocess_training_data.assert_called_once_with(dummy_training_data)
    ml_framework._create_decision_neural_network.assert_called_once()
    ml_framework.training_pipeline.train.assert_called_once()
    ml_framework.model_optimizer.optimize.assert_called_once()
    ml_framework.model_registry.register_model.assert_called_once()

    # Check that the final registration is called with the optimized model
    ml_framework.model_registry.register_model.assert_called_with(
        "decision_model", {"model_type": "OptimizedDecisionNN"}
    )
