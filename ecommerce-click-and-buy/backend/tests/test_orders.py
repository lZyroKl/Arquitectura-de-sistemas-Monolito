import sqlite3

from database import get_connection, init_db
from seed import ensure_demo_user, load_products, main, seed_products
from tests.conftest import SAMPLE_PRODUCTS, SHIPPING


def test_orders_require_login(client):
    assert client.get("/api/orders").status_code == 401
    assert client.get("/api/orders/1").status_code == 401


def test_cannot_create_order_without_payment(auth_client):
    # El endpoint antiguo que creaba pedidos sin pagar ya no existe
    response = auth_client.post("/api/orders", json={"items": []})
    assert response.status_code == 405


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


def test_init_db_migrates_old_orders_table(app):
    conn = get_connection()
    conn.execute("DROP TABLE order_items")
    conn.execute("DROP TABLE orders")
    conn.execute("""CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
                    total REAL NOT NULL, status TEXT DEFAULT 'pending', created_at TIMESTAMP)""")
    conn.commit()
    conn.close()

    init_db()

    conn = get_connection()
    columns = {row["name"] for row in conn.execute("PRAGMA table_info(orders)")}
    conn.close()
    assert {"shipping_cost", "payment_token", "authorization_code"} <= columns


def test_seed_skips_when_products_exist_and_force_reloads(app):
    assert seed_products(SAMPLE_PRODUCTS) == (0, 0)
    assert seed_products(SAMPLE_PRODUCTS[:1], force=True) == (1, 0)
    conn = get_connection()
    assert conn.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 1
    conn.close()


def test_seed_counts_skipped_products(app):
    assert seed_products(SAMPLE_PRODUCTS, force=True) == (3, 1)


def test_seed_main_with_real_catalog(app, capsys):
    assert main(["--force"]) == 0
    assert "productos insertados" in capsys.readouterr().out
    assert main([]) == 0
    assert "ya tiene productos" in capsys.readouterr().out
    assert len(load_products()) > 0


def test_foreign_keys_are_enforced(app):
    conn = get_connection()
    try:
        conn.execute("INSERT INTO order_items (order_id, product_id, size, quantity, price) VALUES (999, 1, '42', 1, 1)")
        raised = False
    except sqlite3.IntegrityError:
        raised = True
    conn.close()
    assert raised


def test_demo_user_is_created_once(client):
    assert ensure_demo_user() is True
    assert ensure_demo_user() is False
    response = client.post("/api/auth/login", json={"email": "demo@clickandbuy.cl", "password": "demo1234"})
    assert response.status_code == 200
