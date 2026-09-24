"""Integración con Webpay Plus (Transbank).

Toda llamada al SDK pasa por este módulo, así las rutas no dependen de
Transbank directamente y los tests pueden reemplazar estas funciones.
"""
from flask import current_app
from transbank.common.integration_api_keys import IntegrationApiKeys
from transbank.common.integration_commerce_codes import IntegrationCommerceCodes
from transbank.common.integration_type import IntegrationType
from transbank.common.options import WebpayOptions
from transbank.error.transbank_error import TransbankError
from transbank.webpay.webpay_plus.transaction import Transaction

PaymentError = TransbankError


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
    """Confirma la transacción una vez que el usuario vuelve desde Webpay."""
    return _build_transaction().commit(token)


def is_approved(commit_response):
    return (
        commit_response.get("response_code") == 0
        and commit_response.get("status") == "AUTHORIZED"
    )
