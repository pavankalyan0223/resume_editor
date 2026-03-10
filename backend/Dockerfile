FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (if PyMuPDF or lxml ever need them)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libglib2.0-0 libx11-6 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY . .

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]

