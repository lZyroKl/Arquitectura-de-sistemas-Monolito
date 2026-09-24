from flask import Blueprint, request, jsonify
from models.product import (
    get_all_products, get_product_by_id, get_product_variants, get_brands, get_categories
)

products_bp = Blueprint("products", __name__)


@products_bp.route("/api/products", methods=["GET"])
def list_products():
    """Listar productos del catálogo (un registro por modelo)
    ---
    tags: [Productos]
    parameters:
      - {in: query, name: brand, type: string, description: Filtrar por marca}
      - {in: query, name: category, type: string, description: Filtrar por categoría}
      - {in: query, name: min_price, type: number, description: Precio mínimo en CLP}
      - {in: query, name: max_price, type: number, description: Precio máximo en CLP}
      - {in: query, name: search, type: string, description: Busca en nombre, marca, colorway y SKU}
    responses:
      200:
        description: Lista de productos
        schema:
          type: array
          items: {$ref: '#/definitions/Product'}
      400:
        description: Filtro de precio inválido
        schema: {$ref: '#/definitions/Error'}
    """
    try:
        products = get_all_products(
            request.args.get("brand"),
            request.args.get("category"),
            request.args.get("min_price"),
            request.args.get("max_price"),
            request.args.get("search"),
        )
    except ValueError:
        return jsonify({"error": "Filtro de precio inválido"}), 400
    return jsonify(products)


@products_bp.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    """Obtener el detalle de un producto
    ---
    tags: [Productos]
    parameters:
      - {in: path, name: product_id, type: integer, required: true}
    responses:
      200:
        description: Producto
        schema: {$ref: '#/definitions/Product'}
      404:
        description: Producto no encontrado
        schema: {$ref: '#/definitions/Error'}
    """
    product = get_product_by_id(product_id)
    if product:
        return jsonify(product)
    return jsonify({"error": "Producto no encontrado"}), 404


@products_bp.route("/api/products/<int:product_id>/variants", methods=["GET"])
def get_variants(product_id):
    """Obtener las variantes (colorways) del mismo modelo
    ---
    tags: [Productos]
    parameters:
      - {in: path, name: product_id, type: integer, required: true}
    responses:
      200:
        description: Variantes del producto
        schema:
          type: array
          items: {$ref: '#/definitions/Product'}
      404:
        description: Variantes no encontradas
        schema: {$ref: '#/definitions/Error'}
    """
    variants = get_product_variants(product_id)
    if variants:
        return jsonify(variants)
    return jsonify({"error": "Variantes no encontradas"}), 404


@products_bp.route("/api/products/brands", methods=["GET"])
def list_brands():
    """Listar las marcas disponibles
    ---
    tags: [Productos]
    responses:
      200:
        description: Marcas
        schema: {type: array, items: {type: string}}
    """
    return jsonify(get_brands())


@products_bp.route("/api/products/categories", methods=["GET"])
def list_categories():
    """Listar las categorías disponibles
    ---
    tags: [Productos]
    responses:
      200:
        description: Categorías
        schema: {type: array, items: {type: string}}
    """
    return jsonify(get_categories())
