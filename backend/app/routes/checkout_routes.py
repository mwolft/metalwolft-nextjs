from flask import Blueprint, g, jsonify, request

from app.services.cart_service import CartService
from app.services.checkout_service import CheckoutError, CheckoutService
from app.utils.auth import login_required


checkout_bp = Blueprint("checkout", __name__, url_prefix="/api/checkout")


@checkout_bp.post("/preview")
@login_required
def preview_checkout():
    data = request.get_json() or {}
    user = g.current_user

    cart, _, _ = CartService.get_or_create_cart(
        anonymous_id=None,
        user=user,
    )

    try:
        payload = CheckoutService.build_checkout_preview(
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

    return jsonify(payload), 200


@checkout_bp.post("/confirm")
@login_required
def confirm_checkout():
    data = request.get_json() or {}
    user = g.current_user

    if not data:
        return jsonify({
            "error": {
                "code": "INVALID_PAYLOAD",
                "message": "checkout confirmation payload is required.",
            }
        }), 400

    try:
        payload = CheckoutService.confirm_checkout(
            user=user,
            cart=None,
            checkout_data=data,
        )
    except CheckoutError as exc:
        return jsonify({
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }), exc.status_code

    return jsonify(payload), 201
