# Edu ML

Educational Machine Learning application combining Python (PyTorch) model training with Next.js web interface for running ONNX models in the browser.

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **ONNX Runtime Web** - Run ONNX models in the browser
- **React Plotly.js** - Interactive data visualization
- **Prettier** - Code formatting
- **ESLint** - Code linting

### Backend / ML
- **Python 3** - Model development
- **PyTorch** - Deep learning framework
- **ONNX** - Model export format
- **NumPy** - Numerical computing

## Project Structure

```
edu-ml/
├── src/                    # Next.js source code
│   ├── app/               # App Router pages
│   │   ├── layout.tsx     # Root layout with navigation
│   │   ├── page.tsx       # Home page
│   │   ├── forecast/      # Forecast demo page
│   │   │   └── page.tsx
│   │   └── regression/    # Linear regression demo page
│   │       └── page.tsx
│   ├── components/        # Reusable React components
│   │   └── ui/
│   │       └── Navigation.tsx
│   └── app/
│       └── globals.css    # Global styles
│
├── py/                    # Python ML models
│   ├── main.py           # Generic ONNX export script
│   ├── forecast.py       # Time series forecasting model
│   ├── linear_regression.py  # Linear regression model
│   └── requirements.txt  # Python dependencies
│
├── public/                # Static assets
│   └── models/           # Exported ONNX models
│       ├── forecast.onnx
│       ├── forecast.meta.json
│       ├── linear_regression.onnx
│       └── linear_regression.meta.json
│
├── venv/                 # Python virtual environment (gitignored)
├── node_modules/         # Node.js dependencies (gitignored)
│
├── Makefile             # Python model export commands
├── package.json         # Node.js dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── README.md           # This file
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and **Yarn**
- **Python 3.8+**
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone git@github.com:CBEPX4EJIOBEK/edu-ml-nextjs-py-onnx.git
   cd edu-ml-nextjs-py-onnx
   ```

2. **Install Node.js dependencies:**
   ```bash
   yarn install
   ```

3. **Set up Python environment and install dependencies:**
   ```bash
   make install
   ```

## Yarn Commands

### Development
```bash
yarn dev          # Start development server on http://localhost:3331
yarn build        # Build for production
yarn start        # Start production server
```

### Code Quality
```bash
yarn lint         # Run ESLint
yarn format       # Format code with Prettier
yarn format:check # Check code formatting without making changes
```

## Makefile Commands

### Python Environment
```bash
make venv         # Create Python virtual environment
make install      # Install Python dependencies (creates venv if needed)
make clean        # Remove virtual environment and Python cache files
```

### Model Export
```bash
make forecast          # Export forecast model to ONNX
make linear_regression # Export linear regression model to ONNX
make help             # Show all available Makefile targets
```

### Direct Python Usage

You can also use the Python export script directly:

```bash
# Export any model with any method
cd py
source ../venv/bin/activate
python main.py <model_name> --<method_name>

# Examples:
python main.py forecast --train_model
python main.py linear_regression --train_model
python main.py my_model --get_model
```

## Workflow

### 1. Create a New Model

Create a new Python file in `py/` directory (e.g., `py/my_model.py`):

```python
import torch
import torch.nn as nn

class MyModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear = nn.Linear(10, 1)
    
    def forward(self, x):
        return self.linear(x)

def train_model():
    """Train and return the model."""
    model = MyModel()
    # ... training code ...
    return model

def get_model_info():
    """Return model export configuration."""
    return {
        'model_name': 'my_model',
        'input_shape': (1, 10),
        'input_dtype': torch.float32,
        'input_names': ['input'],
        'output_names': ['output'],
        'metadata': {'description': 'My custom model'},
    }
```

### 2. Export Model to ONNX

Add a Makefile target or use directly:

```bash
# Via Makefile (add target first)
make my_model

# Or directly
cd py && python main.py my_model --train_model
```

### 3. Use Model in Next.js

The exported model will be available at `/models/my_model.onnx` and can be loaded in your React components:

```typescript
import * as ort from 'onnxruntime-web'

const session = await ort.InferenceSession.create('/models/my_model.onnx')
const input = new ort.Tensor('float32', Float32Array.from([...]), [1, 10])
const outputs = await session.run({ input })
```

## Features

- **Time Series Forecasting** - Forecast future values using MLP neural network
- **Linear Regression** - Interactive linear regression with gradient descent visualization
- **ONNX Runtime Web** - Run models directly in the browser (WebGPU/WASM support)
- **Interactive Charts** - Plotly.js integration for data visualization
- **Dark Theme Navigation** - GitHub-style sidebar navigation

## Development

### Adding a New Page

1. Create a new page in `src/app/<page-name>/page.tsx`
2. Add navigation link in `src/components/ui/Navigation.tsx`

### Adding a New Model

1. Create model file in `py/<model_name>.py` with:
   - Model class definition
   - `train_model()` or `get_model()` function
   - `get_model_info()` function
2. Add Makefile target (optional)
3. Export: `make <model_name>` or `python main.py <model_name> --train_model`
4. Create page to use the model in `src/app/`

## Configuration

- **Port**: Development server runs on port `3331` (configured in `package.json`)
- **Python**: Virtual environment in `venv/` (gitignored)
- **Models**: Exported to `public/models/` for Next.js static serving

## License

MIT

## Author

@CBEPX4EJIOBEK, 2025
