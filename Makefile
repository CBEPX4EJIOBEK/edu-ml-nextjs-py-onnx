.PHONY: help venv install forecast linear_regression clean

help:
	@echo "Available targets:"
	@echo "  make venv              - Create Python virtual environment"
	@echo "  make install           - Install Python dependencies"
	@echo "  make forecast          - Export forecast model to ONNX"
	@echo "  make linear_regression - Export linear regression model to ONNX"
	@echo "  make clean             - Remove Python cache and virtual environment"

venv:
	@if [ ! -d "venv" ]; then \
		echo "Creating virtual environment..."; \
		python3 -m venv venv; \
	else \
		echo "Virtual environment already exists"; \
	fi

install: venv
	@echo "Installing Python dependencies..."
	@. venv/bin/activate && pip install -r py/requirements.txt

forecast: install
	@echo "Exporting forecast model..."
	@. venv/bin/activate && cd py && python main.py forecast --train_model

linear_regression: install
	@echo "Exporting linear regression model..."
	@. venv/bin/activate && cd py && python main.py linear_regression --train_model

clean:
	@echo "Cleaning up..."
	@rm -rf venv
	@find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.pyo" -delete 2>/dev/null || true

