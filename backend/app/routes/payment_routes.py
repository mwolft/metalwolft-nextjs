from flask import Blueprint, g, jsonify, request
import logging

from app.services.checkout_service import CheckoutService
from app.services.payment_service import PaymentError, PaymentService
from app.utils.auth import login_required

logger = logging.getLogger(__name__)


payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")
orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")
webhooks_bp = Blueprint("webhooks", __name__, url_prefix="/webhooks")


@payments_bp.post("/create")
@login_required
def create_payment():
    data = request.get_json() or {}
    order_id = data.get("order_id")
    provider = str(data.get("provider", "mock")).strip().lower() or "mock"

    if order_id is None:
        return jsonify({
            "error": {
                "code": "INVALID_PAYLOAD",
                "message": "order_id is required.",
            }
        }), 400

    try:
        payload = PaymentService.create_payment(
            order_id=int(order_id),
            user_id=g.current_user.id,
            provider=provider,
        )
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


@webhooks_bp.post("/stripe")
def stripe_webhook():
    payload = request.get_data()
    signature = request.headers.get("Stripe-Signature")

    logger.info(
        "stripe_webhook_request_received signature_present=%s payload_bytes=%s",
        bool(signature),
        len(payload or b""),
    )

    try:
        response = PaymentService.handle_stripe_webhook(
            payload=payload,
            signature=signature,
        )
    except PaymentError as exc:
        logger.error(
            "stripe_webhook_request_failed code=%s message=%s",
            exc.code,
            exc.message,
        )
        return jsonify({
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }), exc.status_code

    logger.info("stripe_webhook_request_processed")
    return jsonify(response), 200
