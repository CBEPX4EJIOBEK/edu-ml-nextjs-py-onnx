#!/usr/bin/env python3
"""
Generic model export script.
Usage: python main.py <model_module>
Example: python main.py forecast
"""

import argparse
import importlib
import os
import sys
import torch
import onnx


def export_model(
    model,
    model_info,
    output_dir='../public/models',
    model_name=None,
):
    """
    Export a PyTorch model to ONNX format with all data embedded.

    Args:
        model: PyTorch model (trained or untrained)
        model_info: Dict with keys:
            - model_name: Name of the model
            - input_shape: Shape of input tensor (tuple)
            - input_dtype: Data type of input tensor
            - input_names: List of input names
            - output_names: List of output names
            - metadata: Dict of metadata to save
        output_dir: Directory to save the exported model
        model_name: Override model name (optional)
    """
    if model_name is None:
        model_name = model_info.get('model_name', 'model')

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Prepare dummy input
    input_shape = model_info['input_shape']
    input_dtype = model_info.get('input_dtype', torch.float32)
    dummy_input = torch.zeros(input_shape, dtype=input_dtype)

    # Export to temporary file first
    temp_onnx = os.path.join(output_dir, f'{model_name}.tmp.onnx')
    final_onnx_path = os.path.join(output_dir, f'{model_name}.onnx')

    print(f'Exporting {model_name} to ONNX...')
    torch.onnx.export(
        model,
        dummy_input,
        temp_onnx,
        input_names=model_info.get('input_names', ['input']),
        output_names=model_info.get('output_names', ['output']),
        opset_version=17,
        dynamic_axes={
            'input': {0: 'batch'},
            'output': {0: 'batch'},
        },
    )

    # Load and save model with all data embedded (for browser compatibility)
    print('Embedding all data into ONNX file...')
    onnx_model = onnx.load(temp_onnx)
    onnx.save_model(
        onnx_model,
        final_onnx_path,
        save_as_external_data=False,
        all_tensors_to_one_file=True,
    )

    # Clean up temporary files
    if os.path.exists(temp_onnx):
        os.remove(temp_onnx)
    temp_data_file = temp_onnx + '.data'
    if os.path.exists(temp_data_file):
        os.remove(temp_data_file)
    data_file = final_onnx_path + '.data'
    if os.path.exists(data_file):
        os.remove(data_file)

    # Save metadata
    metadata = model_info.get('metadata', {})
    if metadata:
        meta_path = os.path.join(output_dir, f'{model_name}.meta.json')
        import json
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
        print(f'Wrote {final_onnx_path} and {meta_path}')
    else:
        print(f'Wrote {final_onnx_path}')

    return final_onnx_path


def get_model_from_module(module, method=None):
    """
    Get model from module using specified method or auto-detect.

    Args:
        module: The imported module
        method: Optional method name to use (e.g., 'train_model', 'get_model')
                If None, auto-detects using fallback strategies

    Returns:
        PyTorch model
    """
    # If method is specified, use it
    if method:
        if not hasattr(module, method):
            raise ValueError(
                f'Method "{method}" not found in module. '
                f'Available methods: {[m for m in dir(module) if not m.startswith("_")]}'
            )
        print(f'Using {method}() to get model...')
        return getattr(module, method)()

    # Auto-detect: Strategy 1: train_model() function
    if hasattr(module, 'train_model'):
        print('Using train_model() to get trained model...')
        return module.train_model()

    # Auto-detect: Strategy 2: get_model() function
    if hasattr(module, 'get_model'):
        print('Using get_model() to get model...')
        return module.get_model()

    # Auto-detect: Strategy 3: model in get_model_info()
    if hasattr(module, 'get_model_info'):
        model_info = module.get_model_info()
        if 'model' in model_info:
            print('Using model from get_model_info()...')
            return model_info['model']

    # No model found
    raise ValueError(
        'No model found. Module must provide one of: '
        'train_model(), get_model(), or model in get_model_info(). '
        'Or specify method with --method_name flag.'
    )


def main():
    parser = argparse.ArgumentParser(
        description='Export PyTorch models to ONNX format',
        allow_abbrev=False,
    )
    parser.add_argument(
        'model',
        type=str,
        help='Model module name (e.g., forecast)',
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='../public/models',
        help='Output directory for exported models (default: ../public/models)',
    )

    args, unknown = parser.parse_known_args()

    # Detect method from unknown args (e.g., --train_model, --get_model)
    method = None
    for arg in unknown:
        if arg.startswith('--'):
            method = arg[2:]  # Remove '--' prefix
            break

    # Import the model module
    try:
        module = importlib.import_module(args.model)
    except ImportError as e:
        print(f'Error importing module "{args.model}": {e}', file=sys.stderr)
        sys.exit(1)

    # Check for required function
    if not hasattr(module, 'get_model_info'):
        print(
            f'Error: Module "{args.model}" must have a get_model_info() function',
            file=sys.stderr,
        )
        sys.exit(1)

    # Get model info
    model_info = module.get_model_info()

    # Get model (using specified method or auto-detect)
    try:
        model = get_model_from_module(module, method=method)
    except ValueError as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)

    # Export the model
    export_model(model, model_info, output_dir=args.output_dir)

    print('Export completed successfully!')


if __name__ == '__main__':
    main()
