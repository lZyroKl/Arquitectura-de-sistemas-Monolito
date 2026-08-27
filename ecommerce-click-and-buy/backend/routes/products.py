from flask import Blueprint, request, jsonify
from services.product_service import ProductService

products_bp = Blueprint("products", __name__)


@products_bp.route("/api/products", methods=["GET"])
def list_products():
    brand = request.args.get("brand")
    category = request.args.get("category")
    min_price = request.args.get("min_price")
    max_price = request.args.get("max_price")
    search = request.args.get("search")

    products = ProductService.get_all_products(brand, category, min_price, max_price, search)
    return jsonify(products)


@products_bp.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = ProductService.get_product_by_id(product_id)
    if product:
        return jsonify(product)
    return jsonify({"error": "Producto no encontrado"}), 404

@products_bp.route("/api/products/<int:product_id>/variants", methods=["GET"])
def get_variants(product_id):
    variants = ProductService.get_product_variants(product_id)
    if variants:
        return jsonify(variants)
    return jsonify({"error": "Variantes no encontradas"}), 404


@products_bp.route("/api/products/brands", methods=["GET"])
def list_brands():
    return jsonify(ProductService.get_brands())


@products_bp.route("/api/products/categories", methods=["GET"])
def list_categories():
    return jsonify(ProductService.get_categories())
