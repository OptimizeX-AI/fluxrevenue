import torch
import torch.nn as nn
from typing import List

class DecisionNeuralNetwork(nn.Module):
    """
    A customizable feed-forward neural network for decision-making tasks.
    The architecture (number of layers, neurons) is defined upon instantiation.
    """
    def __init__(self, input_dim: int, hidden_dims: List[int], output_dim: int):
        """
        Initializes the layers of the neural network.

        Args:
            input_dim (int): The number of features in the input data.
            hidden_dims (List[int]): A list where each element is the number of neurons in a hidden layer.
            output_dim (int): The number of possible output classes.
        """
        super().__init__()
        self.layers = nn.ModuleList()

        # Input Layer
        self.layers.append(nn.Linear(input_dim, hidden_dims[0]))
        self.layers.append(nn.ReLU())
        self.layers.append(nn.Dropout(0.2))

        # Hidden Layers
        for i in range(len(hidden_dims) - 1):
            self.layers.append(nn.Linear(hidden_dims[i], hidden_dims[i + 1]))
            self.layers.append(nn.ReLU())
            self.layers.append(nn.Dropout(0.3))

        # Output Layer
        self.layers.append(nn.Linear(hidden_dims[-1], output_dim))
        # Softmax is often applied outside the model (e.g., in the loss function like CrossEntropyLoss)
        # but we include it here as per the prompt's explicit design.
        self.layers.append(nn.Softmax(dim=1))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Defines the forward pass of the model.
        """
        for layer in self.layers:
            x = layer(x)
        return x
