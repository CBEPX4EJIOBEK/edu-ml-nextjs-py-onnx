import json
import math
import numpy as np
import torch
import torch.nn as nn


WINDOW = 24  # сколько точек на вход
HORIZON = 12  # сколько точек прогнозируем


class ForecastMLP(nn.Module):
    def __init__(self, window: int, horizon: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(window, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, horizon),
        )

    def forward(self, x):
        # x: [batch, window]
        return self.net(x)  # [batch, horizon]


def make_toy_data(n_series=512, total_len=WINDOW + HORIZON):
    # Синус + шум, чтобы быстро "обучить" демо-модель
    X = []
    Y = []
    rng = np.random.default_rng(0)

    for _ in range(n_series):
        phase = rng.uniform(0, 2 * math.pi)
        freq = rng.uniform(0.6, 1.4)
        t = np.linspace(0, 2 * math.pi, total_len)
        s = np.sin(freq * t + phase) + 0.05 * rng.standard_normal(total_len)

        x = s[:WINDOW]
        y = s[WINDOW:]
        X.append(x)
        Y.append(y)

    X = np.stack(X).astype(np.float32)
    Y = np.stack(Y).astype(np.float32)
    return X, Y


def train_model():
    """Train the model and return the trained model."""
    torch.manual_seed(0)
    model = ForecastMLP(WINDOW, HORIZON)
    model.train()

    X, Y = make_toy_data()
    x_t = torch.from_numpy(X)
    y_t = torch.from_numpy(Y)

    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.MSELoss()

    # Быстрая "учебка" для демо
    for _ in range(300):
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
        'model_name': 'forecast',
        'input_shape': (1, WINDOW),
        'input_dtype': torch.float32,
        'input_names': ['input'],
        'output_names': ['output'],
        'metadata': {'window': WINDOW, 'horizon': HORIZON},
    }
