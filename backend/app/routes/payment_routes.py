from flask import Blueprint, g, jsonify, request

from app.services.checkout_service import CheckoutService
from app.services.payment_service import PaymentError, PaymentService
from app.utils.auth import login_required


payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")
orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")


@payments_bp.post("/create-stripe-session")
@login_required
def create_stripe_session():
    data = request.get_json() or {}
    order_id = data.get("order_id")

    if order_id is None:
        return jsonify({
            "error": {
                "code": "INVALID_PAYLOAD",
                "message": "order_id is required.",
            }
        }), 400

    try:
        order = PaymentService.get_order_for_user(
            order_id=int(order_id),
            user_id=g.current_user.id,
        )
        payload = PaymentService.create_stripe_session(order=order)
    except ValueError:
        return jsonify({
            "error": {
                "code": "INVALID_PAYLOAD",
                "message": "order_id must be an integer.",
            }
        }), 400
    except PaymentError as exc:
        return jsonify({
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }), exc.status_code

    return jsonify(payload), 201


@payments_bp.post("/mark-bank-transfer")
@login_required
def mark_bank_transfer():
    data = request.get_json() or {}
    order_id = data.get("order_id")

    if order_id is None:
        return jsonify({
            "error": {
                "code": "INVALID_PAYLOAD",
                "message": "order_id is required.",
            }
        }), 400

    try:
        order = PaymentService.get_order_for_user(
            order_id=int(order_id),
            user_id=g.current_user.id,
        )
        payload = PaymentService.mark_bank_transfer(order=order)
    except ValueError:
        return jsonify({
            "error": {
                "code": "INVALID_PAYLOAD",
                "message": "order_id must be an integer.",
            }
        }), 400
    except PaymentError as exc:
        return jsonify({
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }), exc.status_code

    return jsonify(payload), 201


@payments_bp.post("/stripe-webhook")
def stripe_webhook():
    payload = request.get_data()
    signature = request.headers.get("Stripe-Signature")

    try:
        response = PaymentService.handle_stripe_webhook(
            payload=payload,
            signature=signature,
        )
    except PaymentError as exc:
        return jsonify({
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }), exc.status_code

    return jsonify(response), 200


@orders_bp.get("/<int:order_id>")
@login_required
def get_order(order_id: int):
    try:
        order = PaymentService.get_order_for_user(
            order_id=order_id,
            user_id=g.current_user.id,
        )
    except PaymentError as exc:
        return jsonify({
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }), exc.status_code

    return jsonify(CheckoutService.serialize_order(order)), 200


@payments_bp.post("/dev/mark-paid")
def dev_mark_paid():
    data = request.get_json() or {}
    ref = data.get("provider_reference")

    PaymentService._mark_stripe_payment_completed(
        provider_reference=ref
    )

    return jsonify({"status": "ok"}), 200
