from flask import Blueprint, current_app, g, jsonify, redirect, request, url_for

from routes.decorators import login_required
from services.order_service import OrderValidationError
from services.payment_service import PaymentGatewayError, PaymentService

payments_bp = Blueprint("payments", __name__)


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
        result = PaymentService.start_webpay(
            g.user_id,
            data.get("items"),
            data.get("shipping"),
            return_url=url_for("payments.webpay_return", _external=True),
        )
    except OrderValidationError as e:
        return jsonify({"error": e.message}), e.status_code
    except PaymentGatewayError as e:
        return jsonify({"error": str(e)}), 502
    return jsonify(result), 201


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
    order_id = PaymentService.handle_webpay_return(
        token_ws=request.values.get("token_ws"),
        tbk_token=request.values.get("TBK_TOKEN"),
        buy_order=request.values.get("TBK_ORDEN_COMPRA"),
    )
    return _result_redirect(order_id)
