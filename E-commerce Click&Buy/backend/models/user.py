import hashlib
from database import get_connection


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def create_user(name, email, password):
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name, email, hash_password(password))
        )
        conn.commit()
        user = conn.execute("SELECT id, name, email, created_at FROM users WHERE email = ?", (email,)).fetchone()
        conn.close()
        return dict(user)
    except Exception:
        conn.close()
        return None


def authenticate_user(email, password):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM users WHERE email = ? AND password_hash = ?",
        (email, hash_password(password))
    ).fetchone()
    conn.close()
    if row:
        user = dict(row)
        del user["password_hash"]
        return user
    return None


def get_user_by_id(user_id):
    conn = get_connection()
    row = conn.execute("SELECT id, name, email, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if row:
        return dict(row)
    return None
