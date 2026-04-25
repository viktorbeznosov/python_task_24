FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS backend
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --from=frontend-builder /app/frontend/dist /app/frontend_dist
COPY backend/ /app/backend/

RUN mkdir -p /app/data

ENV PYTHONUNBUFFERED=1
ENV PUBLIC_PORT=8000
ENV DATABASE_PATH=/app/data/tasks.db
ENV FRONTEND_DIST=/app/frontend_dist
ENV PYTHONPATH=/app/backend

EXPOSE 8000

WORKDIR /app
CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]