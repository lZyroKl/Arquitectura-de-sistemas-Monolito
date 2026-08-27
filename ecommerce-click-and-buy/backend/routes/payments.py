from flask import Blueprint, request, jsonify, session, redirect
from services.payment_service import PaymentService
from transbank.webpay.webpay_plus.transaction import Transaction
from transbank.common.options import WebpayOptions
from transbank.common.integration_commerce_codes import IntegrationCommerceCodes
from transbank.common.integration_api_keys import IntegrationApiKeys
from transbank.common.integration_type import IntegrationType

def get_tx():
    return Transaction(WebpayOptions(
        commerce_code=IntegrationCommerceCodes.WEBPAY_PLUS, 
        api_key=IntegrationApiKeys.WEBPAY, 
        integration_type=IntegrationType.TEST
    ))

payments_bp = Blueprint("payments", __name__)

@payments_bp.route("/api/payments/webpay/init", methods=["POST"])
def init_webpay():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "No autenticado"}), 401

    data = request.get_json()
    order_id = data.get("order_id")
    if not order_id:
        return jsonify({"error": "Falta order_id"}), 400

    result = PaymentService.init_webpay(order_id, user_id)
    if not result["success"]:
        return jsonify({"error": result["error"]}), 400

    # Inicializar transacción en Transbank
    try:
        # Transbank no acepta URLs con "#" (Hash Routing), así que lo mandamos a nuestro Backend primero
        return_url = "http://localhost:5000/api/payments/webpay/return"
        tx = get_tx()
        response = tx.create(
            buy_order=str(result["buy_order"]),
            session_id=str(result["session_id"]),
            amount=int(result["amount"]), # type: ignore
            return_url=return_url
        )
        return jsonify({"url": response["url"], "token": response["token"]})
    except Exception as e:
        return jsonify({"error": f"Error conectando con Transbank: {str(e)}"}), 500

@payments_bp.route("/api/payments/webpay/return", methods=["GET", "POST"])
def return_webpay():
    # Transbank puede responder con GET o POST dependiendo de si el pago se aprobó o canceló
    token_ws = request.args.get("token_ws") or request.form.get("token_ws")
    tbk_token = request.args.get("TBK_TOKEN") or request.form.get("TBK_TOKEN")
    
    if token_ws:
        return redirect(f"http://localhost:5173/#/webpay-return?token_ws={token_ws}")
    elif tbk_token:
        return redirect(f"http://localhost:5173/#/webpay-return?TBK_TOKEN={tbk_token}")
    else:
        return redirect("http://localhost:5173/#/checkout")

@payments_bp.route("/api/payments/webpay/commit", methods=["POST"])
def commit_webpay():
    data = request.get_json()
    token_ws = data.get("token_ws")
    
    if not token_ws:
        return jsonify({"error": "No se recibió token"}), 400

    result = PaymentService.commit_webpay(token_ws)
    return jsonify(result)

@payments_bp.route("/api/payments/mock", methods=["POST"])
def mock_payment():
    # Para transferencia o mercadopago
    user_id = session.get("user_id")
    data = request.get_json()
    order_id = data.get("order_id")
    method = data.get("method")
    
    result = PaymentService.process_mock_payment(order_id, user_id, method)
    if not result["success"]:
        return jsonify({"error": result["error"]}), 400
    return jsonify(result)
