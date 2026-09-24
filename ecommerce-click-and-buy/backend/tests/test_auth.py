import hashlib

from database import get_connection


def register(client, email="ana@correo.cl", password="secreto123"):
    return client.post("/api/auth/register", json={"name": "Ana", "email": email, "password": password})


def test_register_creates_session(client):
    response = register(client)
    assert response.status_code == 201
    assert "password_hash" not in response.get_json()
    assert client.get("/api/auth/me").get_json()["email"] == "ana@correo.cl"


def test_password_is_stored_salted(client):
    register(client)
    conn = get_connection()
    stored = conn.execute("SELECT password_hash FROM users").fetchone()[0]
    conn.close()
    assert stored != hashlib.sha256(b"secreto123").hexdigest()
    assert "secreto123" not in stored


def test_register_missing_fields(client):
    response = client.post("/api/auth/register", json={"email": "x@x.cl"})
    assert response.status_code == 400


def test_register_duplicate_email(client):
    register(client)
    response = register(client, email="ANA@correo.cl")
    assert response.status_code == 409


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


def test_legacy_sha256_password_is_accepted_and_upgraded(client):
    legacy = hashlib.sha256(b"antigua").hexdigest()
    conn = get_connection()
    conn.execute("INSERT INTO users (name, email, password_hash) VALUES ('Old', 'old@correo.cl', ?)", (legacy,))
    conn.commit()
    conn.close()

    response = client.post("/api/auth/login", json={"email": "old@correo.cl", "password": "antigua"})
    assert response.status_code == 200

    conn = get_connection()
    stored = conn.execute("SELECT password_hash FROM users WHERE email = 'old@correo.cl'").fetchone()[0]
    conn.close()
    assert stored != legacy


def test_me_requires_session(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_deleted_user(client):
    register(client)
    conn = get_connection()
    conn.execute("DELETE FROM users")
    conn.commit()
    conn.close()
    assert client.get("/api/auth/me").status_code == 404


def test_logout(client):
    register(client)
    assert client.post("/api/auth/logout").status_code == 200
    assert client.get("/api/auth/me").status_code == 401
