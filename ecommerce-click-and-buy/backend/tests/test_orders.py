import pytest
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError

from database import db, init_db
from models.order import OrderItem
from models.product import Product
from seed import ensure_demo_user, load_products, main, seed_products
from tests.conftest import SAMPLE_PRODUCTS, SHIPPING


def test_orders_require_login(client):
    assert client.get("/api/orders").status_code == 401
    assert client.get("/api/orders/1").status_code == 401


def test_cannot_create_order_without_payment(auth_client):
    # No existe un endpoint que cree o "pague" pedidos sin pasar por Webpay
    assert auth_client.post("/api/orders", json={"items": []}).status_code == 405
    assert auth_client.post("/api/payments/mock", json={}).status_code == 404


def test_list_orders_empty(auth_client):
    assert auth_client.get("/api/orders").get_json() == []


def test_order_of_another_user_is_hidden(client, fake_webpay):
    client.post("/api/auth/register", json={"name": "A", "email": "a@a.cl", "password": "x"})
    order_id = client.post("/api/payments/webpay/create", json={
        "items": [{"product_id": 1, "size": "42", "quantity": 1}], "shipping": SHIPPING,
    }).get_json()["order_id"]
    assert len(client.get("/api/orders").get_json()) == 1

    client.post("/api/auth/logout")
    client.post("/api/auth/register", json={"name": "B", "email": "b@b.cl", "password": "x"})
    assert client.get(f"/api/orders/{order_id}").status_code == 404
    assert client.get("/api/orders").get_json() == []


def test_init_db_adds_missing_columns_to_old_tables(app):
    with app.app_context():
        with db.engine.begin() as conn:
            conn.execute(text("PRAGMA foreign_keys = OFF"))
            conn.execute(text("DROP TABLE payments"))
            conn.execute(text("DROP TABLE order_items"))
            conn.execute(text("DROP TABLE orders"))
            conn.execute(text(
                "CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, "
                "total REAL NOT NULL, status TEXT DEFAULT 'pending', created_at TIMESTAMP)"
            ))

        init_db()

        inspector = inspect(db.engine)
        columns = {c["name"] for c in inspector.get_columns("orders")}
        assert {"shipping_cost", "shipping_address", "customer_rut"} <= columns
        assert "payments" in inspector.get_table_names()


def test_seed_skips_when_products_exist_and_force_recreates(app):
    with app.app_context():
        assert seed_products(SAMPLE_PRODUCTS) == (0, 0)
        assert seed_products(SAMPLE_PRODUCTS[:1], force=True) == (1, 0)
        assert Product.query.count() == 1


def test_seed_counts_skipped_products(app):
    with app.app_context():
        assert seed_products(SAMPLE_PRODUCTS, force=True) == (3, 1)


def test_seed_main_with_real_catalog(app, capsys, monkeypatch):
    import app as app_module
    monkeypatch.setattr(app_module, "create_app", lambda: app)

    assert main(["--force"]) == 0
    assert "productos insertados" in capsys.readouterr().out
    assert main([]) == 0
    assert "ya tiene productos" in capsys.readouterr().out
    assert len(load_products()) > 0


def test_seed_without_data_file(app, monkeypatch, capsys):
    import seed
    monkeypatch.setattr(seed, "DATA_FILE", "no-existe.json")
    with app.app_context():
        assert seed.run([]) == 1
    assert "No se encontro" in capsys.readouterr().out


def test_demo_user_is_created_once(app, client):
    with app.app_context():
        assert ensure_demo_user() is True
        assert ensure_demo_user() is False
    response = client.post("/api/auth/login", json={"email": "demo@clickandbuy.cl", "password": "demo1234"})
    assert response.status_code == 200


def test_foreign_keys_are_enforced(app):
    with app.app_context():
        db.session.add(OrderItem(order_id=999, product_id=1, size="42", quantity=1, price=1))
        with pytest.raises(IntegrityError):
            db.session.commit()
        db.session.rollback()
