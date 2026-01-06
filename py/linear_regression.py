import numpy as np
import torch
import torch.nn as nn


class LinearRegression(nn.Module):
    def __init__(self, input_size: int = 1, output_size: int = 1):
        super().__init__()
        self.linear = nn.Linear(input_size, output_size)

    def forward(self, x):
        # x: [batch, input_size]
        return self.linear(x)  # [batch, output_size]


def make_toy_data(n_samples=100, input_size=1, noise=0.1):
    """Generate toy data for linear regression: y = 2x + 1 + noise"""
    rng = np.random.default_rng(42)
    X = rng.uniform(-5, 5, (n_samples, input_size)).astype(np.float32)
    # True relationship: y = 2x + 1 + noise
    y = 2 * X.sum(axis=1, keepdims=True) + 1 + noise * rng.standard_normal(
        (n_samples, 1)
    ).astype(np.float32)
    return X, y


def train_model():
    """Train the linear regression model and return the trained model."""
    torch.manual_seed(42)
    input_size = 1
    output_size = 1
    model = LinearRegression(input_size, output_size)
    model.train()

    X, y = make_toy_data(n_samples=100, input_size=input_size)
    x_t = torch.from_numpy(X)
    y_t = torch.from_numpy(y)

    opt = torch.optim.SGD(model.parameters(), lr=0.01)
    loss_fn = nn.MSELoss()

    # Train the model
    for epoch in range(100):
        opt.zero_grad()
        pred = model(x_t)
        loss = loss_fn(pred, y_t)
        loss.backward()
        opt.step()

    model.eval()
    return model


def get_model_info():
    """Return model information for export."""
    return {
        'model_name': 'linear_regression',
        'input_shape': (1, 1),  # [batch, features]
        'input_dtype': torch.float32,
        'input_names': ['input'],
        'output_names': ['output'],
        'metadata': {
            'input_size': 1,
            'output_size': 1,
            'description': 'Simple linear regression model',
        },
    }

