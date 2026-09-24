import os

from flasgger import Swagger
from flask import Flask, abort, jsonify, send_from_directory
from flask_cors import CORS  # type: ignore
from werkzeug.middleware.proxy_fix import ProxyFix

from config import Config
from database import db, init_db
from swagger import SWAGGER_CONFIG, SWAGGER_TEMPLATE


def create_app(config_overrides=None):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)

    # Detrás del proxy de Render/Docker, respeta el esquema y host originales
    # para que la URL de retorno de Webpay se genere con https
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    db.init_app(app)
    CORS(app, supports_credentials=True, origins=app.config["CORS_ORIGINS"])
    Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)

    # Los modelos se importan antes de crear las tablas
    import models  # noqa: F401
    from routes.products import products_bp
    from routes.auth import auth_bp
    from routes.orders import orders_bp
    from routes.payments import payments_bp

    app.register_blueprint(products_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(payments_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        """Estado del servicio
        ---
        tags: [Sistema]
        responses:
          200:
            description: El backend está operativo
        """
        return jsonify({"status": "ok"})

    register_frontend(app)

    with app.app_context():
        init_db()

    return app


def register_frontend(app):
    """Sirve el frontend compilado desde el mismo origen que la API.

    Así la cookie de sesión es de primera parte y el monolito se despliega
    como una sola imagen Docker.
    """
    dist = app.config["FRONTEND_DIST"]
    if not os.path.isfile(os.path.join(dist, "index.html")):
        return

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def frontend(path):
        if path.startswith("api/"):
            abort(404)
        if path and os.path.isfile(os.path.join(dist, path)):
            return send_from_directory(dist, path)
        return send_from_directory(dist, "index.html")


if __name__ == "__main__":
    create_app().run(
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", 5000)),
        debug=os.environ.get("FLASK_DEBUG", "true").lower() == "true",
    )
