from flask import Blueprint, jsonify, g
from services.order_service import OrderService
from routes.decorators import login_required

orders_bp = Blueprint("orders", __name__)

# Los pedidos se crean únicamente a través de /api/payments/webpay/create,
# así no existe un camino para generar pedidos sin pasar por el pago.


@orders_bp.route("/api/orders", methods=["GET"])
@login_required
def list_orders():
    """Listar los pedidos del usuario autenticado
    ---
    tags: [Pedidos]
    responses:
      200:
        description: Pedidos ordenados del más reciente al más antiguo
        schema:
          type: array
          items: {$ref: '#/definitions/Order'}
      401:
        description: No autenticado
        schema: {$ref: '#/definitions/Error'}
    """
    return jsonify(OrderService.get_orders_by_user(g.user_id))


@orders_bp.route("/api/orders/<int:order_id>", methods=["GET"])
@login_required
def get_order(order_id):
    """Obtener un pedido del usuario autenticado
    ---
    tags: [Pedidos]
    parameters:
      - in: path
        name: order_id
        type: integer
        required: true
    responses:
      200:
        description: Pedido con sus productos y estado de pago
        schema: {$ref: '#/definitions/Order'}
      401:
        description: No autenticado
        schema: {$ref: '#/definitions/Error'}
      404:
        description: Pedido no encontrado
        schema: {$ref: '#/definitions/Error'}
    """
    order = OrderService.get_order_for_user(order_id, g.user_id)
    if not order:
        return jsonify({"error": "Pedido no encontrado"}), 404
    return jsonify(order)
