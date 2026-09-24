import pytest

from app import create_app
from database import db
from seed import seed_products

SAMPLE_PRODUCTS = [
    {
        "name": "Air Jordan 1 Retro High", "brand": "Air Jordan", "category": "Basketball",
        "price": 50000, "price_usd": 55, "colorway": "Chicago", "style_id": "AJ1-001",
        "stock": 5, "sizes": ["40", "41", "42"],
    },
    {
        "name": "Air Jordan 1 Retro High", "brand": "Air Jordan", "category": "Basketball",
        "price": 60000, "price_usd": 65, "colorway": "Bred", "style_id": "AJ1-002",
        "stock": 3, "sizes": ["41", "42"],
    },
    {
        "name": "Yeezy Boost 350", "brand": "adidas", "category": "Lifestyle",
        "price": 120000, "price_usd": 130, "colorway": "Zebra", "style_id": "YZY-350",
        "stock": 1, "sizes": ["42"],
    },
    # Sin precio: el seed debe omitirlo
    {"name": "Incompleto", "brand": "Nadie"},
]

SHIPPING = {
    "name": "Juan Pérez",
    "email": "juan@correo.cl",
    "rut": "11.111.111-1",
    "phone": "+56912345678",
    "address": "Av. Providencia 1234",
    "city": "Providencia",
    "region": "Región Metropolitana",
}


@pytest.fixture
def app(tmp_path):
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{tmp_path / 'test.db'}",
        "SECRET_KEY": "test",
        "FRONTEND_URL": "http://frontend.test",
    })
    with app.app_context():
        seed_products(SAMPLE_PRODUCTS)
    yield app
    with app.app_context():
        db.session.remove()
        db.engine.dispose()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_client(client):
    response = client.post("/api/auth/register", json={
        "name": "Juan Pérez", "email": "juan@correo.cl", "password": "secreto123",
    })
    assert response.status_code == 201
    return client


@pytest.fixture
def fake_webpay(monkeypatch):
    """Reemplaza las llamadas a Transbank por respuestas controladas."""
    from services import payment_service

    state = {"created": [], "commit_response": None, "create_error": None, "commit_error": None}

    def fake_create(buy_order, session_id, amount, return_url):
        if state["create_error"]:
            raise state["create_error"]
        token = f"tok-{len(state['created']) + 1}"
        state["created"].append({
            "buy_order": buy_order, "session_id": session_id,
            "amount": amount, "return_url": return_url, "token": token,
        })
        return {"token": token, "url": "https://webpay.test/init"}

    def fake_commit(token):
        if state["commit_error"]:
            raise state["commit_error"]
        return state["commit_response"]

    monkeypatch.setattr(payment_service, "create_transaction", fake_create)
    monkeypatch.setattr(payment_service, "commit_transaction", fake_commit)
    return state
