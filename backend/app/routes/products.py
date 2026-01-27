from flask import Blueprint, jsonify
from app.models import Product

products_bp = Blueprint("products", __name__, url_prefix="/api/products")


@products_bp.route("/", methods=["GET"])
def get_products():
    products = Product.query.all()
    return jsonify([product.serialize() for product in products])
