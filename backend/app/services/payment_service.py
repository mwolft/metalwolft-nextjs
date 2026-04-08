from decimal import Decimal

from app.config import Config
from app.extensions import db
from app.models.order import Order
from app.models.payment import Payment

try:
    import stripe
except ImportError:  # pragma: no cover
    stripe = None


class PaymentError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class PaymentService:
    @staticmethod
    def get_order_for_user(*, order_id: int, user_id: int) -> Order:
        order = Order.query.filter_by(id=order_id, user_id=user_id).first()

        if not order:
            raise PaymentError(
                code="ORDER_NOT_FOUND",
                message="Order not found.",
                status_code=404,
            )

        return order

    @staticmethod
    def create_stripe_session(*, order: Order):
        PaymentService._ensure_order_payable(order)

        if stripe is None:
            raise PaymentError(
                code="STRIPE_NOT_INSTALLED",
                message="Stripe integration is not installed on the backend.",
                status_code=503,
            )

        if not Config.STRIPE_SECRET_KEY or not Config.STRIPE_SUCCESS_URL or not Config.STRIPE_CANCEL_URL:
            raise PaymentError(
                code="STRIPE_NOT_CONFIGURED",
                message="Stripe integration is not configured.",
                status_code=503,
            )

        stripe.api_key = Config.STRIPE_SECRET_KEY

        session = stripe.checkout.Session.create(
            mode="payment",
            success_url=Config.STRIPE_SUCCESS_URL,
            cancel_url=Config.STRIPE_CANCEL_URL,
            customer_email=order.customer_email,
            metadata={
                "order_id": str(order.id),
            },
            line_items=[
                {
                    "price_data": {
                        "currency": order.currency.lower(),
                        "product_data": {
                            "name": f"MetalWolft Order #{order.id}",
                        },
                        "unit_amount": int(Decimal(order.total) * 100),
                    },
                    "quantity": 1,
                }
            ],
        )

        payment = Payment(
            order_id=order.id,
            method="stripe",
            status="pending",
            provider="stripe",
            provider_reference=session.id,
            amount=order.total,
        )
        db.session.add(payment)
        db.session.commit()

        return {
            "payment": PaymentService.serialize_payment(payment),
            "checkout_url": session.url,
        }

    @staticmethod
    def mark_bank_transfer(*, order: Order):
        PaymentService._ensure_order_payable(order)

        payment = Payment(
            order_id=order.id,
            method="bank_transfer",
            status="awaiting_manual_confirmation",
            provider="manual",
            provider_reference=f"bank-transfer-order-{order.id}",
            amount=order.total,
        )
        db.session.add(payment)
        db.session.commit()

        order.status = "awaiting_payment_confirmation"
        db.session.commit()

        return {
            "payment": PaymentService.serialize_payment(payment),
            "order_status": order.status,
        }

    @staticmethod
    def handle_stripe_webhook(*, payload: bytes, signature: str | None):
        if stripe is None:
            raise PaymentError(
                code="STRIPE_NOT_INSTALLED",
                message="Stripe integration is not installed on the backend.",
                status_code=503,
            )

        if not Config.STRIPE_SECRET_KEY or not Config.STRIPE_WEBHOOK_SECRET:
            raise PaymentError(
                code="STRIPE_NOT_CONFIGURED",
                message="Stripe webhook integration is not configured.",
                status_code=503,
            )

        stripe.api_key = Config.STRIPE_SECRET_KEY

        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=signature,
                secret=Config.STRIPE_WEBHOOK_SECRET,
            )
        except Exception as exc:
            raise PaymentError(
                code="INVALID_STRIPE_WEBHOOK",
                message=str(exc),
                status_code=400,
            ) from exc

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            PaymentService._mark_stripe_payment_completed(
                provider_reference=session["id"]
            )

        return {"received": True}

    @staticmethod
    def _mark_stripe_payment_completed(*, provider_reference: str):
        payment = Payment.query.filter_by(
            provider="stripe",
            provider_reference=provider_reference,
        ).first()

        if not payment:
            raise PaymentError(
                code="PAYMENT_NOT_FOUND",
                message="Payment not found for Stripe session.",
                status_code=404,
            )

        payment.status = "paid"
        payment.order.status = "paid"
        db.session.commit()

    @staticmethod
    def _ensure_order_payable(order: Order):
        if order.status == "paid":
            raise PaymentError(
                code="ORDER_ALREADY_PAID",
                message="Order is already paid.",
                status_code=409,
            )

    @staticmethod
    def serialize_payment(payment: Payment):
        return {
            "id": payment.id,
            "order_id": payment.order_id,
            "method": payment.method,
            "status": payment.status,
            "provider": payment.provider,
            "provider_reference": payment.provider_reference,
            "amount": format(Decimal(payment.amount), "f"),
        }
