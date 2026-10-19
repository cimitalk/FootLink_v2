# Lightweight production Dockerfile for Footlink FastAPI Core
# Multi-platform & zero-cost deployable (Fly.io / Render / Railway Free-Tier)
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FOOTLINK_PORT=8000 \
    FOOTLINK_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and source
COPY Applicativo/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt || true

COPY Applicativo/backend/app ./app
COPY Applicativo/backend/run_server.py ./
COPY Applicativo/database/schema.sql ../database/schema.sql

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["python3", "run_server.py"]
