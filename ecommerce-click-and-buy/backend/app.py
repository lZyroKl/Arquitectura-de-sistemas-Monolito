import os
from flask import Flask
from flask_cors import CORS  # type: ignore
from dotenv import load_dotenv
from database import db

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("SECRET_KEY", "default-secret-key-if-not-set")
    
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("DATABASE_URL", "sqlite:///store.db")
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(app)

    CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

    from routes.products import products_bp
    from routes.auth import auth_bp
    from routes.orders import orders_bp
    from routes.payments import payments_bp

    app.register_blueprint(products_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(payments_bp)

    return app

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
