from flask import Blueprint, request, jsonify, session
from models.user import create_user, authenticate_user, get_user_by_id

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not all(k in data for k in ("name", "email", "password")):
        return jsonify({"error": "Faltan campos requeridos"}), 400

    user = create_user(data["name"], data["email"], data["password"])
    if not user:
        return jsonify({"error": "El email ya está registrado"}), 409

    session["user_id"] = user["id"]
    return jsonify(user), 201


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not all(k in data for k in ("email", "password")):
        return jsonify({"error": "Faltan campos requeridos"}), 400

    user = authenticate_user(data["email"], data["password"])
    if not user:
        return jsonify({"error": "Credenciales inválidas"}), 401

    session["user_id"] = user["id"]
    return jsonify(user)


@auth_bp.route("/api/auth/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "No autenticado"}), 401

    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(user)


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"message": "Sesión cerrada"})
