# Dockerfile for deploying mlserver (Flask) on Hugging Face Spaces (Docker runtime)
# Bind service to $PORT (Spaces expects a web service on the container port)

FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PORT=7860

# Install system dependencies needed by opencv, ffmpeg, audio libs, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    git \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python requirements
COPY mlserver/requirements.txt /app/requirements.txt

RUN pip install --upgrade pip setuptools wheel
# Install requirements plus gunicorn (server)
RUN pip install -r /app/requirements.txt && pip install gunicorn

# Copy the mlserver folder into the container
COPY mlserver /app

# Expose the port Spaces expects (7860)
EXPOSE 7860

# Command: run Gunicorn pointing at Flask app object in app.py
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:7860", "--workers", "1", "--threads", "4", "--timeout", "120"]
