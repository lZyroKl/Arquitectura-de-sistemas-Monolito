import hashlib

from database import db
from models.user import User


def register(client, email="ana@correo.cl", password="secreto123"):
    return client.post("/api/auth/register", json={"name": "Ana", "email": email, "password": password})


def stored_hash(app, email):
    with app.app_context():
        return User.query.filter_by(email=email).first().password_hash


def test_register_creates_session(client):
    response = register(client)
    assert response.status_code == 201
    assert "password_hash" not in response.get_json()
    assert client.get("/api/auth/me").get_json()["email"] == "ana@correo.cl"


def test_password_is_stored_salted(app, client):
    register(client)
    stored = stored_hash(app, "ana@correo.cl")
    assert stored != hashlib.sha256(b"secreto123").hexdigest()
    assert "secreto123" not in stored


def test_register_missing_fields(client):
    response = client.post("/api/auth/register", json={"email": "x@x.cl"})
    assert response.status_code == 400


def test_register_duplicate_email(client):
    register(client)
    response = register(client, email="ANA@correo.cl")
    assert response.status_code == 409


def test_register_integrity_error_is_handled(app, monkeypatch):
    from sqlalchemy.exc import IntegrityError
    from services.user_service import UserService

    def failing_commit():
        raise IntegrityError("INSERT", {}, Exception("duplicado"))

    with app.app_context():
        monkeypatch.setattr(db.session, "commit", failing_commit)
        assert UserService.create_user("X", "x@x.cl", "clave") is None


def test_login_success_and_case_insensitive_email(client):
    register(client)
    client.post("/api/auth/logout")
    response = client.post("/api/auth/login", json={"email": "Ana@Correo.cl", "password": "secreto123"})
    assert response.status_code == 200
    assert response.get_json()["name"] == "Ana"


def test_login_wrong_password(client):
    register(client)
    response = client.post("/api/auth/login", json={"email": "ana@correo.cl", "password": "mala"})
    assert response.status_code == 401


def test_login_missing_fields(client):
    assert client.post("/api/auth/login", json={}).status_code == 400


def test_legacy_sha256_password_is_accepted_and_upgraded(app, client):
    legacy = hashlib.sha256(b"antigua").hexdigest()
    with app.app_context():
        db.session.add(User(name="Old", email="old@correo.cl", password_hash=legacy))
        db.session.commit()

    response = client.post("/api/auth/login", json={"email": "old@correo.cl", "password": "antigua"})
    assert response.status_code == 200
    assert stored_hash(app, "old@correo.cl") != legacy


def test_me_requires_session(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_deleted_user(app, client):
    register(client)
    with app.app_context():
        User.query.delete()
        db.session.commit()
    assert client.get("/api/auth/me").status_code == 404


def test_logout(client):
    register(client)
    assert client.post("/api/auth/logout").status_code == 200
    assert client.get("/api/auth/me").status_code == 401
