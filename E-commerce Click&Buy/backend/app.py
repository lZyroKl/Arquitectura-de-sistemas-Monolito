from flask import Flask
from flask_cors import CORS
from database import init_db
from routes.products import products_bp
from routes.auth import auth_bp
from routes.orders import orders_bp

app = Flask(__name__)
app.secret_key = "sneaker-store-secret-key-2026"

CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

app.register_blueprint(products_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(orders_bp)

init_db()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
