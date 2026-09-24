import pytest
from transbank.error.transbank_error import TransbankError

from database import get_connection
from tests.conftest import SHIPPING


def stock_of(product_id):
    conn = get_connection()
    stock = conn.execute("SELECT stock FROM products WHERE id = ?", (product_id,)).fetchone()[0]
    conn.close()
    return stock


def start_payment(client, items=None, shipping=SHIPPING):
    items = items or [{"product_id": 1, "size": "42", "quantity": 1}]
    return client.post("/api/payments/webpay/create", json={"items": items, "shipping": shipping})


def approved_commit(order_id, amount, card="6623"):
    return {
        "response_code": 0, "status": "AUTHORIZED", "buy_order": f"CB-{order_id:06d}",
        "amount": amount, "authorization_code": "1213", "card_detail": {"card_number": card},
    }


# --- Creación de la transacción -------------------------------------------------

def test_create_requires_login(client, fake_webpay):
    assert start_payment(client).status_code == 401


def test_create_uses_database_prices_and_adds_shipping(auth_client, fake_webpay):
    items = [{"product_id": 1, "size": "42", "quantity": 1, "price": 1}]  # precio manipulado
    response = start_payment(auth_client, items)

    assert response.status_code == 201
    body = response.get_json()
    assert body["url"] == "https://webpay.test/init"
    assert body["amount"] == 50000 + 4990
    assert fake_webpay["created"][0]["amount"] == 54990
    assert fake_webpay["created"][0]["buy_order"] == f"CB-{body['order_id']:06d}"
    assert fake_webpay["created"][0]["return_url"].endswith("/api/payments/webpay/return")

    order = auth_client.get(f"/api/orders/{body['order_id']}").get_json()
    assert order["status"] == "pending"
    assert order["subtotal"] == 50000
    assert order["shipping_cost"] == 4990
    assert order["shipping_address"] == SHIPPING["address"]
    assert order["items"][0]["price"] == 50000


def test_free_shipping_over_threshold(auth_client, fake_webpay):
    response = start_payment(auth_client, [{"product_id": 3, "size": "42", "quantity": 1}])
    assert response.get_json()["amount"] == 120000


@pytest.mark.parametrize("items, status", [
    ([], 400),
    ([{"product_id": 1}], 400),
    ([{"product_id": "x", "size": "42", "quantity": 1}], 400),
    ([{"product_id": 1, "size": "42", "quantity": 0}], 400),
    ([{"product_id": 999, "size": "42", "quantity": 1}], 404),
    ([{"product_id": 1, "size": "50", "quantity": 1}], 400),
    ([{"product_id": 3, "size": "42", "quantity": 2}], 409),
    ([{"product_id": 3, "size": "42", "quantity": 1}, {"product_id": 3, "size": "42", "quantity": 1}], 409),
])
def test_create_rejects_invalid_items(auth_client, fake_webpay, items, status):
    response = auth_client.post("/api/payments/webpay/create", json={"items": items, "shipping": SHIPPING})
    assert response.status_code == status
    assert fake_webpay["created"] == []


def test_create_requires_shipping_data(auth_client, fake_webpay):
    response = start_payment(auth_client, shipping={**SHIPPING, "address": " "})
    assert response.status_code == 400
    assert "address" in response.get_json()["error"]

    response = auth_client.post("/api/payments/webpay/create", json={"items": []})
    assert response.status_code == 400


def test_create_handles_webpay_error(auth_client, fake_webpay):
    fake_webpay["create_error"] = TransbankError("caído", 500)
    response = start_payment(auth_client)
    assert response.status_code == 502

    orders = auth_client.get("/api/orders").get_json()
    assert orders[0]["status"] == "failed"


# --- Retorno desde Webpay -------------------------------------------------------

def test_return_approved_marks_paid_and_discounts_stock(auth_client, fake_webpay):
    body = start_payment(auth_client, [{"product_id": 1, "size": "42", "quantity": 2}]).get_json()
    fake_webpay["commit_response"] = approved_commit(body["order_id"], body["amount"])

    response = auth_client.post("/api/payments/webpay/return", data={"token_ws": body["token"]})

    assert response.status_code == 302
    assert response.headers["Location"] == f"http://frontend.test/#/checkout/result?order={body['order_id']}"
    order = auth_client.get(f"/api/orders/{body['order_id']}").get_json()
    assert order["status"] == "paid"
    assert order["authorization_code"] == "1213"
    assert order["card_last4"] == "6623"
    assert stock_of(1) == 3


def test_return_is_idempotent(auth_client, fake_webpay):
    body = start_payment(auth_client).get_json()
    fake_webpay["commit_response"] = approved_commit(body["order_id"], body["amount"])
    auth_client.get(f"/api/payments/webpay/return?token_ws={body['token']}")
    auth_client.get(f"/api/payments/webpay/return?token_ws={body['token']}")
    assert stock_of(1) == 4


def test_return_rejected_by_bank(auth_client, fake_webpay):
    body = start_payment(auth_client).get_json()
    fake_webpay["commit_response"] = {**approved_commit(body["order_id"], body["amount"]),
                                      "response_code": -1, "status": "FAILED"}
    auth_client.get(f"/api/payments/webpay/return?token_ws={body['token']}")

    assert auth_client.get(f"/api/orders/{body['order_id']}").get_json()["status"] == "rejected"
    assert stock_of(1) == 5


def test_return_rejects_amount_mismatch(auth_client, fake_webpay):
    body = start_payment(auth_client).get_json()
    fake_webpay["commit_response"] = approved_commit(body["order_id"], 1)
    auth_client.get(f"/api/payments/webpay/return?token_ws={body['token']}")
    assert auth_client.get(f"/api/orders/{body['order_id']}").get_json()["status"] == "rejected"


def test_return_commit_error(auth_client, fake_webpay):
    body = start_payment(auth_client).get_json()
    fake_webpay["commit_error"] = TransbankError("timeout", 500)
    auth_client.get(f"/api/payments/webpay/return?token_ws={body['token']}")
    assert auth_client.get(f"/api/orders/{body['order_id']}").get_json()["status"] == "rejected"


def test_return_cancelled_by_user(auth_client, fake_webpay):
    body = start_payment(auth_client).get_json()
    response = auth_client.post("/api/payments/webpay/return", data={
        "TBK_TOKEN": body["token"], "TBK_ORDEN_COMPRA": f"CB-{body['order_id']:06d}",
    })
    assert response.headers["Location"].endswith(f"order={body['order_id']}")
    assert auth_client.get(f"/api/orders/{body['order_id']}").get_json()["status"] == "cancelled"


def test_return_timeout(auth_client, fake_webpay):
    body = start_payment(auth_client).get_json()
    auth_client.post("/api/payments/webpay/return", data={
        "TBK_ORDEN_COMPRA": f"CB-{body['order_id']:06d}", "TBK_ID_SESION": "1",
    })
    assert auth_client.get(f"/api/orders/{body['order_id']}").get_json()["status"] == "cancelled"


@pytest.mark.parametrize("data", [
    {"token_ws": "desconocido"},
    {"TBK_TOKEN": "desconocido"},
    {"TBK_ORDEN_COMPRA": "XX-1"},
    {"TBK_ORDEN_COMPRA": "CB-abc"},
    {},
])
def test_return_with_unknown_data_redirects_without_order(client, fake_webpay, data):
    response = client.post("/api/payments/webpay/return", data=data)
    assert response.status_code == 302
    assert response.headers["Location"] == "http://frontend.test/#/checkout/result"


# --- Servicio de pago -----------------------------------------------------------

def test_payment_service_builds_integration_and_production_transactions(app):
    from services import payment_service
    from transbank.common.integration_type import IntegrationType

    with app.app_context():
        assert payment_service._build_transaction().options.integration_type == IntegrationType.TEST
        app.config.update(TBK_ENV="production", TBK_COMMERCE_CODE="123", TBK_API_KEY="abc")
        tx = payment_service._build_transaction()
        assert tx.options.integration_type == IntegrationType.LIVE
        assert tx.options.commerce_code == "123"


def test_payment_service_delegates_to_sdk(app, monkeypatch):
    from services import payment_service
    from transbank.webpay.webpay_plus.transaction import Transaction

    monkeypatch.setattr(Transaction, "create", lambda self, *args: {"token": "t", "url": "u"})
    monkeypatch.setattr(Transaction, "commit", lambda self, token: {"token": token})
    with app.app_context():
        assert payment_service.create_transaction("CB-1", "1", 1000, "http://x")["token"] == "t"
        assert payment_service.commit_transaction("abc") == {"token": "abc"}


def test_is_approved():
    from services.payment_service import is_approved
    assert is_approved({"response_code": 0, "status": "AUTHORIZED"})
    assert not is_approved({"response_code": 0, "status": "FAILED"})
    assert not is_approved({"response_code": -1, "status": "AUTHORIZED"})
