from flask import Blueprint, jsonify, request
from app.services.product_service import ProductService

products_bp = Blueprint(
    "products",
    __name__,
    url_prefix="/api/products"
)
categories_bp = Blueprint(
    "categories",
    __name__,
    url_prefix="/api/categories"
)


@products_bp.route("/", methods=["GET"])
def get_products():
    """
    Lista pública de productos.
    """
    category = request.args.get("category")

    products = ProductService.get_public_products(category=category)

    return jsonify([
        product.serialize_public() for product in products
    ])


@products_bp.route("/<string:slug>", methods=["GET"])
def get_product(slug):
    """
    Detalle público de producto por slug.
    """
    product = ProductService.get_public_product_by_slug(slug)

    if not product:
        return jsonify({"error": "Product not found"}), 404

    return jsonify(product.serialize_public(include_content=True))


@categories_bp.route("/", methods=["GET"])
def get_categories():
    """
    Lista pública de categorías activas raíz.
    """
    categories = ProductService.get_public_root_categories()

    return jsonify([
        category.serialize_public() for category in categories
    ])
