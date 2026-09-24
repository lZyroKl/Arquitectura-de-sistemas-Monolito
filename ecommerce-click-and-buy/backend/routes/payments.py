from flask import Blueprint, current_app, g, jsonify, redirect, request, url_for
from requests import RequestException

from models.order import (
    create_order, get_order_by_id, get_order_by_token, mark_order_paid,
    set_payment_token, update_order_status,
)
from routes.decorators import login_required
from services import payment_service
from services.order_service import (
    OrderValidationError, build_order_lines, calculate_shipping, validate_shipping,
)

payments_bp = Blueprint("payments", __name__)

BUY_ORDER_PREFIX = "CB-"


def buy_order_for(order_id):
    return f"{BUY_ORDER_PREFIX}{order_id:06d}"


def _order_id_from_buy_order(buy_order):
    if not buy_order or not buy_order.startswith(BUY_ORDER_PREFIX):
        return None
    try:
        return int(buy_order[len(BUY_ORDER_PREFIX):])
    except ValueError:
        return None


def _result_redirect(order_id=None):
    url = f"{current_app.config['FRONTEND_URL']}/#/checkout/result"
    if order_id:
        url += f"?order={order_id}"
    return redirect(url)


@payments_bp.route("/api/payments/webpay/create", methods=["POST"])
@login_required
def create_webpay_transaction():
    """Crear el pedido e iniciar el pago con Webpay Plus
    ---
    tags: [Pagos]
    description: |
      Valida el carrito contra la base de datos (precios, tallas y stock), calcula el envío,
      crea el pedido en estado `pending` e inicia una transacción en Webpay Plus.
      El frontend debe enviar un formulario POST a `url` con el campo `token_ws` = `token`.
      Los precios enviados por el cliente se ignoran.
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [items, shipping]
          properties:
            items:
              type: array
              items:
                type: object
                required: [product_id, size, quantity]
                properties:
                  product_id: {type: integer, example: 1}
                  size: {type: string, example: "42"}
                  quantity: {type: integer, example: 1}
            shipping: {$ref: '#/definitions/ShippingData'}
    responses:
      201:
        description: Transacción creada
        schema:
          type: object
          properties:
            order_id: {type: integer}
            token: {type: string}
            url: {type: string, example: "https://webpay3gint.transbank.cl/webpayserver/initTransaction"}
            amount: {type: integer}
      400:
        description: Datos del pedido inválidos
        schema: {$ref: '#/definitions/Error'}
      401:
        description: No autenticado
        schema: {$ref: '#/definitions/Error'}
      404:
        description: Producto inexistente
        schema: {$ref: '#/definitions/Error'}
      409:
        description: Stock insuficiente
        schema: {$ref: '#/definitions/Error'}
      502:
        description: Webpay no respondió correctamente
        schema: {$ref: '#/definitions/Error'}
    """
    data = request.get_json(silent=True) or {}
    try:
        shipping = validate_shipping(data.get("shipping"))
        lines, subtotal = build_order_lines(data.get("items"))
    except OrderValidationError as e:
        return jsonify({"error": e.message}), e.status_code

    shipping_cost = calculate_shipping(subtotal)
    order = create_order(g.user_id, lines, subtotal, shipping_cost, shipping)
    amount = int(round(order["total"]))

    try:
        response = payment_service.create_transaction(
            buy_order=buy_order_for(order["id"]),
            session_id=str(g.user_id),
            amount=amount,
            return_url=url_for("payments.webpay_return", _external=True),
        )
    except (payment_service.PaymentError, RequestException):
        current_app.logger.exception("Error al crear la transacción Webpay")
        update_order_status(order["id"], "failed")
        return jsonify({"error": "No fue posible iniciar el pago con Webpay. Intenta nuevamente."}), 502

    set_payment_token(order["id"], response["token"])
    return jsonify({
        "order_id": order["id"],
        "token": response["token"],
        "url": response["url"],
        "amount": amount,
    }), 201


@payments_bp.route("/api/payments/webpay/return", methods=["GET", "POST"])
def webpay_return():
    """URL de retorno de Webpay Plus (la llama Transbank, no el frontend)
    ---
    tags: [Pagos]
    description: |
      Webpay redirige aquí al usuario al terminar. Según los parámetros recibidos:
      - solo `token_ws`: se confirma (commit) la transacción → pedido `paid` o `rejected`.
      - `TBK_TOKEN`: el usuario anuló el pago → pedido `cancelled`.
      - solo `TBK_ORDEN_COMPRA` / `TBK_ID_SESION`: se agotó el tiempo → pedido `cancelled`.
      Luego redirige al frontend en `/#/checkout/result?order=<id>`.
    parameters:
      - {in: query, name: token_ws, type: string}
      - {in: query, name: TBK_TOKEN, type: string}
      - {in: query, name: TBK_ORDEN_COMPRA, type: string}
      - {in: query, name: TBK_ID_SESION, type: string}
    responses:
      302:
        description: Redirección a la página de resultado del frontend
    """
    token_ws = request.values.get("token_ws")
    tbk_token = request.values.get("TBK_TOKEN")
    buy_order = request.values.get("TBK_ORDEN_COMPRA")

    # Pago anulado por el usuario (o error en el formulario de Webpay)
    if tbk_token:
        order = get_order_by_token(tbk_token)
        if order and order["status"] == "pending":
            update_order_status(order["id"], "cancelled")
        return _result_redirect(order["id"] if order else None)

    # Tiempo agotado: Webpay solo envía la orden de compra
    if not token_ws:
        order_id = _order_id_from_buy_order(buy_order)
        order = get_order_by_id(order_id) if order_id else None
        if order and order["status"] == "pending":
            update_order_status(order["id"], "cancelled")
        return _result_redirect(order["id"] if order else None)

    order = get_order_by_token(token_ws)
    if not order:
        return _result_redirect()

    # Evita confirmar dos veces si el usuario recarga la página de retorno
    if order["status"] != "pending":
        return _result_redirect(order["id"])

    try:
        result = payment_service.commit_transaction(token_ws)
    except (payment_service.PaymentError, RequestException):
        current_app.logger.exception("Error al confirmar la transacción Webpay")
        update_order_status(order["id"], "rejected")
        return _result_redirect(order["id"])

    matches_order = (
        result.get("buy_order") == buy_order_for(order["id"])
        and int(result.get("amount", -1)) == int(round(order["total"]))
    )

    if payment_service.is_approved(result) and matches_order:
        card_last4 = (result.get("card_detail") or {}).get("card_number")
        mark_order_paid(order["id"], result.get("authorization_code"), card_last4)
    else:
        update_order_status(order["id"], "rejected")

    return _result_redirect(order["id"])
