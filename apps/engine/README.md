# Conductor Engine

FastAPI + LangGraph backend for Conductor AI.

## Quick Start

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -e ".[dev]"

# Copy environment file
cp .env.example .env
# Edit .env to add your OPENAI_API_KEY

# Run the server
uvicorn conductor.main:app --reload --port 8000
```

## API Endpoints

- `GET /` - Health check
- `GET /docs` - Swagger documentation
- `POST /api/execute` - Execute a graph (sync)
- `POST /api/execute/stream` - Execute a graph with SSE streaming

## Development

```bash
# Run tests
pytest

# Type checking
mypy conductor

# Linting
ruff check conductor
```
