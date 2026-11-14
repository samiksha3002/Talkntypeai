# Build from the restoration worktree root. No credentials or customer files copied.
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 ANONYMIZED_TELEMETRY=False TIKTOKEN_CACHE_DIR=/opt/tiktoken-cache
WORKDIR /app
COPY TNT_BRAIN/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt httpx
# Resolve verified public tokenizer data at build time; runtime stays network=none.
RUN python -c "import tiktoken; tiktoken.encoding_for_model('text-embedding-3-small')"
COPY TNT_BRAIN/*.py /app/TNT_BRAIN/
COPY TNT_BRAIN/services/*.py /app/TNT_BRAIN/services/
COPY TNT_BRAIN/legal_db /app/TNT_BRAIN/legal_db
COPY tests/legal-memory-linux.py /app/tests/legal-memory-linux.py
WORKDIR /app/TNT_BRAIN
CMD ["python", "-B", "/app/tests/legal-memory-linux.py"]
