# The AI Samri server. Builds anywhere Docker runs (Google Cloud Run, Hugging Face Spaces, Render, a VPS, your own computer).
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# the Arabic voice (Piper "ar_JO-kareem", from the sherpa-onnx releases)
COPY get_voice.py .
RUN python get_voice.py
COPY *.py poems.json ./
ENV PORT=7860
EXPOSE 7860
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
