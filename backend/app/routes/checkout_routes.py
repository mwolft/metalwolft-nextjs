from flask import Blueprint, g, jsonify, request

from app.services.cart_service import CartService
from app.services.checkout_service import CheckoutError, CheckoutService
from app.utils.auth import login_required


checkout_bp = Blueprint("checkout", __name__, url_prefix="/api/checkout")


@checkout_bp.post("/create-order")
@login_required
def create_order():
    data = request.get_json() or {}
    user = g.current_user

    cart, _, _ = CartService.get_or_create_cart(
        anonymous_id=None,
        user=user,
    )

    try:
        payload = CheckoutService.create_order(
            user=user,
            cart=cart,
            data=data,
        )
    except CheckoutError as exc:
        return jsonify({
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }), exc.status_code

    return jsonify(payload), 201
