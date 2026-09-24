import hashlib
import hmac
import sqlite3

from werkzeug.security import generate_password_hash, check_password_hash

from database import get_connection


def hash_password(password):
    return generate_password_hash(password)


def _is_legacy_hash(password_hash):
    # Las primeras cuentas se guardaron como SHA-256 sin sal (64 caracteres hex)
    return len(password_hash) == 64 and "$" not in password_hash


def verify_password(password_hash, password):
    if _is_legacy_hash(password_hash):
        legacy = hashlib.sha256(password.encode()).hexdigest()
        return hmac.compare_digest(legacy, password_hash)
    return check_password_hash(password_hash, password)


def create_user(name, email, password):
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name, email, hash_password(password))
        )
        conn.commit()
        user = conn.execute("SELECT id, name, email, created_at FROM users WHERE email = ?", (email,)).fetchone()
        return dict(user)
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def authenticate_user(email, password):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE email = ? COLLATE NOCASE", (email,)).fetchone()
    if not row or not verify_password(row["password_hash"], password):
        conn.close()
        return None

    # Re-hashea las contraseñas antiguas al iniciar sesión
    if _is_legacy_hash(row["password_hash"]):
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(password), row["id"]))
        conn.commit()
    conn.close()

    user = dict(row)
    del user["password_hash"]
    return user


def get_user_by_id(user_id):
    conn = get_connection()
    row = conn.execute("SELECT id, name, email, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if row:
        return dict(row)
    return None
