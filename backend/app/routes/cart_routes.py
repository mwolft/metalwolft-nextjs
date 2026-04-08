from flask import Blueprint, request, jsonify, make_response

from app.services.cart_service import (
    CartNotFoundError,
    CartOwnershipError,
    CartService,
)
from app.services.pricing_service import PricingError
from app.utils.auth import get_current_user_from_request, login_required


cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")


def _resolve_cart():
    anonymous_id = request.cookies.get("anon_cart_id")
    user = get_current_user_from_request()

    return CartService.get_or_create_cart(
        anonymous_id=anonymous_id,
        user=user,
    )


def _cart_response():
    cart, anon_id, cart_type = _resolve_cart()
    payload = CartService.serialize_cart(cart=cart, cart_type=cart_type)
    response = make_response(jsonify(payload))

    if cart_type == "anonymous" and request.cookies.get("anon_cart_id") != anon_id:
        response.set_cookie(
            "anon_cart_id",
            anon_id,
            httponly=True,
            samesite="Lax"
        )

    return response


@cart_bp.get("")
def get_cart():
    return _cart_response()


@cart_bp.post("/items")
def add_cart_item():
    data = request.get_json() or {}
    cart, anon_id, cart_type = _resolve_cart()

    try:
        CartService.add_item(
            cart=cart,
            product_id=int(data.get("product_id")),
            width_cm=int(data.get("width_cm")),
            height_cm=int(data.get("height_cm")),
            quantity=int(data.get("quantity", 1)),
        )
    except TypeError:
        return jsonify({
            "error": {
                "code": "INVALID_PAYLOAD",
                "message": "product_id, width_cm and height_cm are required.",
            }
        }), 400
    except ValueError:
        return jsonify({
            "error": {
                "code": "INVALID_PAYLOAD",
                "message": "product_id, width_cm, height_cm and quantity must be integers.",
            }
        }), 400
    except PricingError as exc:
        return jsonify({
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }), exc.status_code

    response = make_response(
        jsonify(CartService.serialize_cart(cart=cart, cart_type=cart_type)),
        201,
    )

    if cart_type == "anonymous" and request.cookies.get("anon_cart_id") != anon_id:
        response.set_cookie(
            "anon_cart_id",
            anon_id,
            httponly=True,
            samesite="Lax"
        )

    return response


@cart_bp.patch("/items/<int:item_id>")
def update_cart_item(item_id: int):
    data = request.get_json() or {}
    cart, anon_id, cart_type = _resolve_cart()

    if not data:
        return jsonify({
            "error": {
                "code": "INVALID_PAYLOAD",
                "message": "At least one field must be provided.",
            }
        }), 400

    try:
        CartService.update_item(
            cart=cart,
            item_id=item_id,
            product_id=int(data["product_id"]) if "product_id" in data else None,
            width_cm=int(data["width_cm"]) if "width_cm" in data else None,
            height_cm=int(data["height_cm"]) if "height_cm" in data else None,
            quantity=int(data["quantity"]) if "quantity" in data else None,
        )
    except ValueError:
        return jsonify({
            "error": {
                "code": "INVALID_PAYLOAD",
                "message": "product_id, width_cm, height_cm and quantity must be integers.",
            }
        }), 400
    except (CartNotFoundError, CartOwnershipError) as exc:
        return jsonify({
            "error": {
                "code": "CART_ITEM_NOT_FOUND",
                "message": str(exc),
            }
        }), 404
    except PricingError as exc:
        return jsonify({
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }), exc.status_code

    response = make_response(
        jsonify(CartService.serialize_cart(cart=cart, cart_type=cart_type))
    )

    if cart_type == "anonymous" and request.cookies.get("anon_cart_id") != anon_id:
        response.set_cookie(
            "anon_cart_id",
            anon_id,
            httponly=True,
            samesite="Lax"
        )

    return response


@cart_bp.delete("/items/<int:item_id>")
def delete_cart_item(item_id: int):
    cart, anon_id, cart_type = _resolve_cart()

    try:
        CartService.delete_item(cart=cart, item_id=item_id)
    except (CartNotFoundError, CartOwnershipError) as exc:
        return jsonify({
            "error": {
                "code": "CART_ITEM_NOT_FOUND",
                "message": str(exc),
            }
        }), 404

    response = make_response(
        jsonify(CartService.serialize_cart(cart=cart, cart_type=cart_type))
    )

    if cart_type == "anonymous" and request.cookies.get("anon_cart_id") != anon_id:
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
    user = get_current_user_from_request()

    if not anonymous_id:
        return jsonify({"message": "No anonymous cart to merge"}), 200

    anonymous_cart, _, _ = CartService.get_or_create_cart(
        anonymous_id=anonymous_id,
        user=None,
    )
    user_cart, _, _ = CartService.get_or_create_cart(
        anonymous_id=None,
        user=user,
    )

    if anonymous_cart.id != user_cart.id:
        CartService.merge_carts(user_cart=user_cart, anonymous_cart=anonymous_cart)

    response = make_response(
        jsonify(CartService.serialize_cart(cart=user_cart, cart_type="user"))
    )
    response.delete_cookie("anon_cart_id")

    return response
