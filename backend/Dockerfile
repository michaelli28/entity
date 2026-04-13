# syntax=docker/dockerfile:1.7
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    UV_SYSTEM_PYTHON=1 \
    UV_LINK_MODE=copy

# System deps for asyncpg + pgvector + SSL
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libpq-dev curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# uv (fast Python package manager)
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /uvx /usr/local/bin/

WORKDIR /app

# Install deps first (better layer caching)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# App source
COPY src ./src

# Railway injects $PORT — default to 8000 for local docker run
ENV PORT=8000
EXPOSE 8000

# uv-managed venv is at .venv
CMD ["sh", "-c", "uv run uvicorn src.main:app --host 0.0.0.0 --port ${PORT}"]
