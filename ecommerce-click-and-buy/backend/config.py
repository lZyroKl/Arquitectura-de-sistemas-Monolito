import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def _env_bool(name, default=False):
    return os.environ.get(name, str(default)).strip().lower() in ("1", "true", "yes")


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    DB_PATH = os.environ.get("DB_PATH", os.path.join(BASE_DIR, "store.db"))

    # Build de Vite que Flask sirve en producción (en desarrollo se usa `npm run dev`)
    FRONTEND_DIST = os.environ.get("FRONTEND_DIST", os.path.join(BASE_DIR, "frontend_dist"))

    # URL del frontend: se usa para CORS y para volver desde Webpay.
    # En Render se toma automáticamente la URL pública del servicio.
    FRONTEND_URL = (
        os.environ.get("FRONTEND_URL")
        or os.environ.get("RENDER_EXTERNAL_URL")
        or "http://localhost:5173"
    ).rstrip("/")
    CORS_ORIGINS = [
        origin.strip().rstrip("/")
        for origin in os.environ.get("CORS_ORIGINS", FRONTEND_URL).split(",")
        if origin.strip()
    ]

    # En producción el frontend y el backend viven en dominios distintos,
    # por lo que la cookie de sesión necesita SameSite=None; Secure
    SESSION_COOKIE_SECURE = _env_bool("COOKIE_SECURE")
    SESSION_COOKIE_SAMESITE = "None" if SESSION_COOKIE_SECURE else "Lax"

    # Webpay Plus: "integration" usa las credenciales públicas de prueba de Transbank
    TBK_ENV = os.environ.get("TBK_ENV", "integration")
    TBK_COMMERCE_CODE = os.environ.get("TBK_COMMERCE_CODE", "")
    TBK_API_KEY = os.environ.get("TBK_API_KEY", "")
