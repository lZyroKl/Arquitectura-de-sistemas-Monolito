from functools import wraps

from flask import g, jsonify, session


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "No autenticado"}), 401
        g.user_id = user_id
        return view(*args, **kwargs)
    return wrapper
