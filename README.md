# Edu ML

Educational Machine Learning application combining Python (PyTorch) model training with Next.js web interface for running ONNX models in the browser.

## How It Works

This application demonstrates a **serverless ML architecture** that runs machine learning models entirely in the browser without requiring a backend API server.

### Architecture Overview

1. **Model Development (Python/PyTorch)**
   - Models are developed and trained using PyTorch in Python
   - Training happens locally during development (not in production)
   - Models are exported to ONNX format for cross-platform compatibility

2. **Model Export (ONNX)**
   - Trained PyTorch models are converted to ONNX format
   - ONNX files are embedded with all weights (no external data files)
   - Models are saved to `public/models/` as static assets

3. **Static File Serving (Next.js)**
   - ONNX model files are served as static assets via Next.js
   - No backend API required - models are just files in the `public/` directory
   - Models are accessible at `/models/<model-name>.onnx`

4. **Browser Inference (ONNX Runtime Web)**
   - Models are loaded directly in the browser using ONNX Runtime Web
   - Inference runs entirely client-side using WebGPU or WebAssembly
   - No data is sent to any server - all computation happens locally
   - Supports real-time predictions with interactive visualizations

### Key Benefits

- **No Backend Required**: Models run entirely in the browser
- **Privacy-First**: All data processing happens client-side
- **Fast Inference**: WebGPU acceleration when available
- **Offline Capable**: Once loaded, models work without internet
- **Cost-Effective**: No server costs for model inference
- **Scalable**: Static file serving scales automatically

### Workflow

```
┌─────────────────┐
│  Python/PyTorch │  Train model locally
│  Model Training │  ──────────────────┐
└─────────────────┘                     │
                                        ▼
┌─────────────────┐
│  ONNX Export    │  Convert to ONNX format
│  (make forecast)│  ──────────────────┐
└─────────────────┘                     │
                                        ▼
┌─────────────────┐
│  Static Files   │  Copy to public/models/
│  (public/)      │  ──────────────────┐
└─────────────────┘                     │
                                        ▼
┌─────────────────┐
│  Next.js Server │  Serve static files
│  (yarn dev)     │  ──────────────────┐
└─────────────────┘                     │
                                        ▼
┌─────────────────┐
│  Browser        │  Load model & run inference
│  (ONNX Runtime) │  All computation client-side
└─────────────────┘
```

This architecture means you can deploy the entire application as a static site (e.g., Vercel, Netlify) without any backend infrastructure!

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

## Deployment

### GitHub Actions Workflow

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds ONNX models and deploys to Vercel.

#### Required Secrets

Configure the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

- **`VERCEL_TOKEN`**: Your Vercel authentication token
  - Get it from: https://vercel.com/account/tokens
  - Create a new token with appropriate permissions

- **`VERCEL_SCOPE`**: Your Vercel team/scope ID (also used as organization ID)
  - Format: `team_<id>` or your username/team name
  - Find it in your Vercel dashboard or by running `vercel whoami` locally
  - This is used as both scope and organization ID (required by Vercel CLI v50+)
  - Example: `team_yGAqxKgDjkzRfs5NLzpxKfXI`

- **`VERCEL_PROJECT_ID`**: Your Vercel project ID
  - Format: `prj_<id>`
  - Find it in your Vercel project settings or `.vercel/project.json` after linking
  - Example: `prj_escRKuAAuVFptwS81QVz7MvrLddI`
  
**Note**: Vercel CLI v50+ requires both `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`. The workflow automatically uses `VERCEL_SCOPE` as the organization ID, so you don't need to set `VERCEL_ORG_ID` separately.

#### How to Find Your Vercel IDs

1. **Scope ID**:

   ```bash
   vercel whoami
   # Or check Vercel dashboard > Settings > General
   ```

2. **Project ID**:
   ```bash
   vercel link
   # Check the generated .vercel/project.json file
   # Or in Vercel dashboard > Project Settings > General
   ```

#### Workflow Steps

The workflow automatically:

1. Sets up Node.js and Python environments
2. Installs all dependencies
3. Builds all ONNX models (forecast, linear_regression)
4. Builds the Next.js application
5. Deploys to Vercel production

#### Triggering the Workflow

1. Go to **Actions** tab in GitHub
2. Select **"Build and Deploy to Vercel"** workflow
3. Click **"Run workflow"** button
4. The workflow will use the configured secrets automatically

## License

MIT

## Author

@CBEPX4EJIOBEK, 2025
