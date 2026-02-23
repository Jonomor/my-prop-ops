FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install dependencies with Emergent's private PyPI
RUN pip install --no-cache-dir -r requirements.txt \
    --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Start command - explicitly use sh -c to expand $PORT variable from Railway
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
