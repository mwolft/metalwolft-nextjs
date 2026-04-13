import uuid
from decimal import Decimal
import logging

from sqlalchemy.orm import selectinload

from app.config import Config
from app.extensions import db
from app.models.order import Order
from app.models.payment import Payment

try:
    import stripe
except ImportError:  # pragma: no cover
    stripe = None


logger = logging.getLogger(__name__)


class PaymentError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class PaymentService:
    ACTIVE_STATUSES = {"pending"}
    FINAL_ORDER_STATUSES = {"paid", "cancelled", "failed"}

    @staticmethod
    def get_order_for_user(*, order_id: int, user_id: int) -> Order:
        order = (
            Order.query
            .options(selectinload(Order.payments))
            .filter_by(id=order_id, user_id=user_id)
            .first()
        )

        if not order:
            raise PaymentError(
                code="ORDER_NOT_FOUND",
                message="Order not found.",
                status_code=404,
            )

        return order

    @staticmethod
    def create_payment(*, order_id: int, user_id: int, provider: str = "mock"):
        try:
            with db.session.begin():
                order = (
                    Order.query
                    .options(selectinload(Order.payments))
                    .filter_by(id=order_id, user_id=user_id)
                    .with_for_update()
                    .first()
                )

                if not order:
                    raise PaymentError(
                        code="ORDER_NOT_FOUND",
                        message="Order not found.",
                        status_code=404,
                    )

                if order.status == "paid":
                    raise PaymentError(
                        code="ORDER_ALREADY_PAID",
                        message="Order is already paid.",
                        status_code=409,
                    )

                active_payment = next(
                    (
                        payment for payment in order.payments
                        if payment.status in PaymentService.ACTIVE_STATUSES
                    ),
                    None,
                )
                if active_payment:
                    raise PaymentError(
                        code="ACTIVE_PAYMENT_EXISTS",
                        message="An active payment already exists for this order.",
                        status_code=409,
                    )

                idempotency_key = uuid.uuid4().hex
                external_id = f"mock_{provider}_{uuid.uuid4().hex}"

                payment = Payment(
                    order_id=order.id,
                    provider=provider,
                    status="pending",
                    amount=Decimal(order.total),
                    currency=order.currency,
                    external_id=external_id,
                    idempotency_key=idempotency_key,
                )
                db.session.add(payment)
                db.session.flush()
        except PaymentError:
            raise

        return {
            "payment": PaymentService.serialize_payment(payment),
            "provider_payload": {
                "provider": provider,
                "external_id": external_id,
                "status": "pending",
            },
        }

    @staticmethod
    def serialize_payment(payment: Payment):
        return {
            "id": payment.id,
            "order_id": payment.order_id,
            "provider": payment.provider,
            "status": payment.status,
            "amount": format(Decimal(payment.amount), "f"),
            "currency": payment.currency,
            "external_id": payment.external_id,
            "idempotency_key": payment.idempotency_key,
        }

    @staticmethod
    def handle_stripe_webhook(*, payload: bytes, signature: str | None):
        event = PaymentService._construct_stripe_event(
            payload=payload,
            signature=signature,
        )

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            PaymentService._mark_stripe_payment_succeeded(
                external_id=session["id"],
                amount_total=session.get("amount_total"),
                currency=session.get("currency"),
            )
        elif event["type"] == "checkout.session.expired":
            session = event["data"]["object"]
            PaymentService._mark_stripe_payment_failed(
                external_id=session["id"],
                event_type=event["type"],
            )
        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            PaymentService._mark_stripe_payment_failed(
                external_id=payment_intent["id"],
                event_type=event["type"],
            )

        return {"received": True}

    @staticmethod
    def _construct_stripe_event(*, payload: bytes, signature: str | None):
        if stripe is None:
            raise PaymentError(
                code="STRIPE_NOT_INSTALLED",
                message="Stripe integration is not installed on the backend.",
                status_code=503,
            )

        if not Config.STRIPE_WEBHOOK_SECRET:
            raise PaymentError(
                code="STRIPE_NOT_CONFIGURED",
                message="Stripe webhook integration is not configured.",
                status_code=503,
            )

        if not signature:
            raise PaymentError(
                code="INVALID_STRIPE_SIGNATURE",
                message="Missing Stripe signature.",
                status_code=400,
            )

        try:
            return stripe.Webhook.construct_event(
                payload=payload,
                sig_header=signature,
                secret=Config.STRIPE_WEBHOOK_SECRET,
            )
        except Exception as exc:
            raise PaymentError(
                code="INVALID_STRIPE_SIGNATURE",
                message=str(exc),
                status_code=400,
            ) from exc

    @staticmethod
    def _mark_stripe_payment_succeeded(
        *,
        external_id: str,
        amount_total,
        currency: str | None,
    ):
        with db.session.begin():
            payment = (
                Payment.query
                .options(selectinload(Payment.order))
                .filter_by(provider="stripe", external_id=external_id)
                .with_for_update()
                .first()
            )

            if not payment:
                logger.error(
                    "stripe_webhook_payment_not_found external_id=%s order_id=%s payment_id=%s",
                    external_id,
                    None,
                    None,
                )
                return

            if payment.status == "succeeded":
                logger.info(
                    "stripe_webhook_payment_already_succeeded external_id=%s order_id=%s payment_id=%s",
                    external_id,
                    payment.order_id,
                    payment.id,
                )
                return

            expected_amount = Decimal(payment.amount)
            received_amount = PaymentService._stripe_amount_to_decimal(amount_total)
            expected_currency = str(payment.currency).lower()
            received_currency = str(currency or "").lower()

            if received_amount != expected_amount or received_currency != expected_currency:
                logger.error(
                    "stripe_webhook_amount_mismatch external_id=%s order_id=%s payment_id=%s",
                    external_id,
                    payment.order_id,
                    payment.id,
                )
                raise PaymentError(
                    code="STRIPE_PAYMENT_MISMATCH",
                    message="Stripe payment amount or currency mismatch.",
                    status_code=400,
                )

            payment.status = "succeeded"
            if payment.order.status not in PaymentService.FINAL_ORDER_STATUSES:
                payment.order.status = "paid"

            logger.info(
                "stripe_webhook_payment_succeeded external_id=%s order_id=%s payment_id=%s",
                external_id,
                payment.order_id,
                payment.id,
            )

    @staticmethod
    def _mark_stripe_payment_failed(*, external_id: str, event_type: str):
        with db.session.begin():
            payment = (
                Payment.query
                .options(selectinload(Payment.order))
                .filter_by(provider="stripe", external_id=external_id)
                .with_for_update()
                .first()
            )

            if not payment:
                logger.error(
                    "stripe_webhook_payment_not_found external_id=%s order_id=%s payment_id=%s",
                    external_id,
                    None,
                    None,
                )
                return

            if payment.status == "failed":
                logger.info(
                    "stripe_webhook_payment_already_failed external_id=%s order_id=%s payment_id=%s",
                    external_id,
                    payment.order_id,
                    payment.id,
                )
                return

            payment.status = "failed"
            if payment.order.status not in PaymentService.FINAL_ORDER_STATUSES:
                payment.order.status = "payment_failed"

            logger.info(
                "stripe_webhook_payment_failed event_type=%s external_id=%s order_id=%s payment_id=%s",
                event_type,
                external_id,
                payment.order_id,
                payment.id,
            )

    @staticmethod
    def _stripe_amount_to_decimal(amount_total) -> Decimal:
        if amount_total is None:
            raise PaymentError(
                code="INVALID_STRIPE_EVENT",
                message="Stripe event missing amount_total.",
                status_code=400,
            )

        try:
            return (Decimal(int(amount_total)) / Decimal("100")).quantize(Decimal("0.01"))
        except (TypeError, ValueError, ArithmeticError) as exc:
            raise PaymentError(
                code="INVALID_STRIPE_EVENT",
                message="Invalid Stripe amount_total.",
                status_code=400,
            ) from exc
