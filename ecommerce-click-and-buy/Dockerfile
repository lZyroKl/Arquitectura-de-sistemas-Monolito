# ---------- Etapa 1: compilar el frontend (Vite vanilla) ----------
FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# La API se sirve desde el mismo origen que el frontend
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---------- Etapa 2: backend Flask que sirve API + frontend ----------
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////data/store.db \
    FRONTEND_DIST=/app/frontend_dist \
    PORT=5000
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend /frontend/dist ./frontend_dist

RUN useradd --create-home appuser && mkdir -p /data && chown -R appuser /data /app
USER appuser

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ[\"PORT\"]}/api/health')"

# Carga el catálogo y la cuenta demo si la BD está vacía y luego levanta gunicorn
CMD ["sh", "-c", "python seed.py && exec gunicorn --bind 0.0.0.0:${PORT} --workers 2 --access-logfile - 'app:create_app()'"]
