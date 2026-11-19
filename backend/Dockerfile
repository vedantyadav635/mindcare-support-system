# MindCare backend: FastAPI + PostgreSQL + Hugging Face models on CPU
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# CPU-only PyTorch first: on Linux the default torch wheel bundles CUDA and is several GB larger.
# requirements.txt then sees torch is already installed and keeps this build.
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Run as a normal user, not root. The Hugging Face model cache lives in a volume (see docker-compose.yml)
# so the ~800 MB models are downloaded once, not on every container start.
RUN useradd --create-home appuser \
    && mkdir -p /home/appuser/.cache/huggingface \
    && chown -R appuser:appuser /app /home/appuser/.cache
USER appuser
ENV HF_HOME=/home/appuser/.cache/huggingface

EXPOSE 8000

# Apply database migrations, then start the API (one worker: the login rate limiter is in-memory)
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
