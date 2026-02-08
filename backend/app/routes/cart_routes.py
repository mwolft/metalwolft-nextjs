from flask import Blueprint, request, jsonify, make_response, g
from app.services.cart_service import CartService
from app.utils.auth import login_required

cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")


@cart_bp.get("")
def get_cart():
    anonymous_id = request.cookies.get("anon_cart_id")

    cart, anon_id = CartService.get_or_create_anonymous_cart(anonymous_id)

    response = make_response(jsonify({
        "cart_id": cart.id,
        "type": "anonymous"
    }))

    if not anonymous_id:
        response.set_cookie(
            "anon_cart_id",
            anon_id,
            httponly=True,
            samesite="Lax"
        )

    return response


@cart_bp.post("/merge")
@login_required
def merge_cart():
    anonymous_id = request.cookies.get("anon_cart_id")
    user = g.current_user

    if not anonymous_id:
        return jsonify({"message": "No anonymous cart to merge"}), 200

    anon_cart, _ = CartService.get_or_create_anonymous_cart(anonymous_id)
    user_cart = CartService.get_or_create_user_cart(user.id)

    CartService.merge_carts(user_cart, anon_cart)

    response = make_response(jsonify({"message": "Cart merged"}))
    response.delete_cookie("anon_cart_id")

    return response
