"""Pagos con Webpay Plus (Transbank).

Las funciones `create_transaction` y `commit_transaction` son las únicas que
hablan con el SDK; los tests las reemplazan para no depender de la red.
"""
from datetime import datetime, timezone

from flask import current_app
from requests import RequestException
from transbank.common.integration_api_keys import IntegrationApiKeys
from transbank.common.integration_commerce_codes import IntegrationCommerceCodes
from transbank.common.integration_type import IntegrationType
from transbank.common.options import WebpayOptions
from transbank.error.transbank_error import TransbankError
from transbank.webpay.webpay_plus.transaction import Transaction

from database import db
from models.order import Order
from models.payment import Payment
from services.order_service import OrderService

BUY_ORDER_PREFIX = "CB-"
GATEWAY_ERRORS = (TransbankError, RequestException)


class PaymentGatewayError(Exception):
    """Webpay no respondió o rechazó la creación de la transacción."""


def _build_transaction():
    config = current_app.config
    if config["TBK_ENV"] == "production":
        options = WebpayOptions(config["TBK_COMMERCE_CODE"], config["TBK_API_KEY"], IntegrationType.LIVE)
    else:
        options = WebpayOptions(
            IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, IntegrationType.TEST
        )
    return Transaction(options)


def create_transaction(buy_order, session_id, amount, return_url):
    """Devuelve {"token": ..., "url": ...} para redirigir al formulario de Webpay."""
    return _build_transaction().create(buy_order, session_id, amount, return_url)


def commit_transaction(token):
    """Confirma la transacción cuando el usuario vuelve desde Webpay."""
    return _build_transaction().commit(token)


def is_approved(commit_response):
    return (
        commit_response.get("response_code") == 0
        and commit_response.get("status") == "AUTHORIZED"
    )


def buy_order_for(order_id):
    return f"{BUY_ORDER_PREFIX}{order_id:06d}"


def order_id_from_buy_order(buy_order):
    if not buy_order or not buy_order.startswith(BUY_ORDER_PREFIX):
        return None
    try:
        return int(buy_order[len(BUY_ORDER_PREFIX):])
    except ValueError:
        return None


class PaymentService:
    @staticmethod
    def start_webpay(user_id, items, shipping, return_url):
        """Valida el carrito, crea el pedido 'pending' e inicia la transacción en Webpay.

        Lanza OrderValidationError si el carrito o el despacho son inválidos y
        PaymentGatewayError si Webpay falla.
        """
        shipping = OrderService.validate_shipping(shipping)
        lines, subtotal = OrderService.build_order_lines(items)
        shipping_cost = OrderService.calculate_shipping(subtotal)

        order = OrderService.create_order(user_id, lines, subtotal, shipping_cost, shipping)
        amount = int(round(order.total))
        payment = Payment(order_id=order.id, method="webpay", amount=amount, status="pending")
        db.session.add(payment)
        db.session.commit()

        try:
            response = create_transaction(
                buy_order=buy_order_for(order.id),
                session_id=str(user_id),
                amount=amount,
                return_url=return_url,
            )
        except GATEWAY_ERRORS as e:
            current_app.logger.exception("Error al crear la transacción Webpay")
            PaymentService._set_status(order, payment, "failed")
            raise PaymentGatewayError("No fue posible iniciar el pago con Webpay. Intenta nuevamente.") from e

        payment.token = response["token"]
        db.session.commit()
        return {"order_id": order.id, "token": response["token"], "url": response["url"], "amount": amount}

    @staticmethod
    def handle_webpay_return(token_ws=None, tbk_token=None, buy_order=None):
        """Procesa el retorno desde Webpay y devuelve el id del pedido (o None).

        - solo token_ws: se confirma la transacción (commit).
        - TBK_TOKEN: el usuario anuló el pago.
        - solo TBK_ORDEN_COMPRA: se agotó el tiempo en el formulario de Webpay.
        """
        if tbk_token:
            payment = Payment.query.filter_by(token=tbk_token).first()
            return PaymentService._cancel(payment.order if payment else None)

        if not token_ws:
            order_id = order_id_from_buy_order(buy_order)
            return PaymentService._cancel(db.session.get(Order, order_id) if order_id else None)

        payment = Payment.query.filter_by(token=token_ws).first()
        if not payment:
            return None
        order = payment.order

        # Evita confirmar dos veces si el usuario recarga la página de retorno
        if payment.status != "pending":
            return order.id

        try:
            result = commit_transaction(token_ws)
        except GATEWAY_ERRORS:
            current_app.logger.exception("Error al confirmar la transacción Webpay")
            PaymentService._set_status(order, payment, "rejected")
            return order.id

        matches_order = (
            result.get("buy_order") == buy_order_for(order.id)
            and int(result.get("amount", -1)) == int(round(order.total))
        )
        payment.response_code = result.get("response_code")

        if is_approved(result) and matches_order:
            PaymentService._approve(order, payment, result)
        else:
            PaymentService._set_status(order, payment, "rejected")
        return order.id

    @staticmethod
    def _approve(order, payment, result):
        payment.status = "approved"
        payment.authorization_code = result.get("authorization_code")
        payment.card_last4 = (result.get("card_detail") or {}).get("card_number")
        order.status = "paid"
        order.paid_at = datetime.now(timezone.utc)
        for item in order.items:
            item.product.stock = max(item.product.stock - item.quantity, 0)
        db.session.commit()

    @staticmethod
    def _cancel(order):
        if not order:
            return None
        if order.status == "pending":
            PaymentService._set_status(order, order.payment, "cancelled")
        return order.id

    @staticmethod
    def _set_status(order, payment, status):
        order.status = status
        if payment:
            payment.status = status
        db.session.commit()
