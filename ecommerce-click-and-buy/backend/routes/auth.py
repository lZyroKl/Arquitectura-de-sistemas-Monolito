from flask import Blueprint, request, jsonify, session, g
from services.user_service import UserService
from routes.decorators import login_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    """Registrar un usuario nuevo e iniciar su sesión
    ---
    tags: [Autenticación]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [name, email, password]
          properties:
            name: {type: string, example: Juan Pérez}
            email: {type: string, example: juan@correo.cl}
            password: {type: string, example: secreto123}
    responses:
      201:
        description: Usuario creado
        schema: {$ref: '#/definitions/User'}
      400:
        description: Faltan campos requeridos
        schema: {$ref: '#/definitions/Error'}
      409:
        description: El email ya está registrado
        schema: {$ref: '#/definitions/Error'}
    """
    data = request.get_json(silent=True)
    if not data or not all(str(data.get(k, "")).strip() for k in ("name", "email", "password")):
        return jsonify({"error": "Faltan campos requeridos"}), 400

    user = UserService.create_user(data["name"], data["email"], data["password"])
    if not user:
        return jsonify({"error": "El email ya está registrado"}), 409

    session["user_id"] = user["id"]
    return jsonify(user), 201


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    """Iniciar sesión (crea una cookie de sesión)
    ---
    tags: [Autenticación]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [email, password]
          properties:
            email: {type: string, example: juan@correo.cl}
            password: {type: string, example: secreto123}
    responses:
      200:
        description: Sesión iniciada
        schema: {$ref: '#/definitions/User'}
      400:
        description: Faltan campos requeridos
        schema: {$ref: '#/definitions/Error'}
      401:
        description: Credenciales inválidas
        schema: {$ref: '#/definitions/Error'}
    """
    data = request.get_json(silent=True)
    if not data or not all(k in data for k in ("email", "password")):
        return jsonify({"error": "Faltan campos requeridos"}), 400

    user = UserService.authenticate_user(data["email"], data["password"])
    if not user:
        return jsonify({"error": "Credenciales inválidas"}), 401

    session["user_id"] = user["id"]
    return jsonify(user)


@auth_bp.route("/api/auth/me", methods=["GET"])
@login_required
def me():
    """Obtener el usuario de la sesión actual
    ---
    tags: [Autenticación]
    responses:
      200:
        description: Usuario autenticado
        schema: {$ref: '#/definitions/User'}
      401:
        description: No autenticado
        schema: {$ref: '#/definitions/Error'}
      404:
        description: Usuario no encontrado
        schema: {$ref: '#/definitions/Error'}
    """
    user = UserService.get_user_by_id(g.user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(user)


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    """Cerrar la sesión actual
    ---
    tags: [Autenticación]
    responses:
      200:
        description: Sesión cerrada
    """
    session.pop("user_id", None)
    return jsonify({"message": "Sesión cerrada"})
