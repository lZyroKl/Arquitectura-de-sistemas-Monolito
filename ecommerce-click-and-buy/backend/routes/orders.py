from flask import Blueprint, request, jsonify, session
from models.order import create_order, get_orders_by_user

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("/api/orders", methods=["GET"])
def list_orders():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "No autenticado"}), 401

    orders = get_orders_by_user(user_id)
    return jsonify(orders)


@orders_bp.route("/api/orders", methods=["POST"])
def place_order():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "No autenticado"}), 401

    data = request.get_json()
    if not data or "items" not in data or len(data["items"]) == 0:
        return jsonify({"error": "El pedido debe contener al menos un producto"}), 400

    for item in data["items"]:
        if not all(k in item for k in ("product_id", "size", "quantity", "price")):
            return jsonify({"error": "Datos de producto incompletos"}), 400

    order = create_order(user_id, data["items"])
    return jsonify(order), 201
