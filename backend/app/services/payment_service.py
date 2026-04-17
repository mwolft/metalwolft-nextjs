import uuid
from decimal import Decimal
import logging
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
import requests

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

            provider_payload = {
                "provider": provider,
                "external_id": external_id,
                "status": "pending",
            }

            if provider == "stripe":
                session = PaymentService._create_stripe_checkout_session(
                    order=order,
                    payment=payment,
                )
                payment.external_id = session.id
                external_id = session.id
                provider_payload = {
                    "provider": provider,
                    "external_id": session.id,
                    "status": "pending",
                    "checkout_url": session.url,
                }
            elif provider == "paypal":
                paypal_order = PaymentService._create_paypal_checkout_order(
                    order=order,
                    payment=payment,
                )
                payment.external_id = paypal_order["id"]
                external_id = paypal_order["id"]
                provider_payload = {
                    "provider": provider,
                    "external_id": paypal_order["id"],
                    "status": "pending",
                    "checkout_url": paypal_order["checkout_url"],
                }

            db.session.commit()
        except PaymentError:
            db.session.rollback()
            raise
        except Exception:
            db.session.rollback()
            raise

        return {
            "payment": PaymentService.serialize_payment(payment),
            "provider_payload": provider_payload,
        }

    @staticmethod
    def capture_paypal_payment(*, order_id: int, user_id: int, paypal_order_id: str):
        try:
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

            payment = next(
                (
                    current_payment
                    for current_payment in order.payments
                    if current_payment.provider == "paypal"
                    and current_payment.external_id == paypal_order_id
                ),
                None,
            )

            if not payment:
                raise PaymentError(
                    code="PAYMENT_NOT_FOUND",
                    message="PayPal payment not found for this order.",
                    status_code=404,
                )

            if payment.status == "succeeded":
                return {
                    "payment": PaymentService.serialize_payment(payment),
                    "order_status": order.status,
                    "provider_status": "COMPLETED",
                }

            access_token = PaymentService._get_paypal_access_token()
            response = requests.post(
                f"{Config.PAYPAL_BASE_URL}/v2/checkout/orders/{paypal_order_id}/capture",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                timeout=30,
            )
            data = response.json()

            if not response.ok:
                raise PaymentError(
                    code="PAYPAL_CAPTURE_ERROR",
                    message=data.get("message") or "Failed to capture PayPal order.",
                    status_code=502,
                )

            provider_status = str(data.get("status", "")).upper()

            if provider_status == "COMPLETED":
                payment.status = "succeeded"
                if order.status not in PaymentService.FINAL_ORDER_STATUSES:
                    order.status = "paid"
            elif provider_status in {"VOIDED", "FAILED", "DECLINED"}:
                payment.status = "failed"
                if order.status not in PaymentService.FINAL_ORDER_STATUSES:
                    order.status = "payment_failed"

            db.session.commit()
        except PaymentError:
            db.session.rollback()
            raise
        except Exception:
            db.session.rollback()
            raise

        return {
            "payment": PaymentService.serialize_payment(payment),
            "order_status": order.status,
            "provider_status": provider_status,
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

        logger.info(
            "stripe_webhook_event_received type=%s",
            event["type"],
        )

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            logger.info(
                "stripe_webhook_checkout_completed session_id=%s",
                session.get("id"),
            )
            PaymentService._mark_stripe_payment_succeeded(
                external_id=session["id"],
                amount_total=session.get("amount_total"),
                currency=session.get("currency"),
            )
        elif event["type"] == "checkout.session.expired":
            session = event["data"]["object"]
            logger.info(
                "stripe_webhook_checkout_expired session_id=%s",
                session.get("id"),
            )
            PaymentService._mark_stripe_payment_failed(
                external_id=session["id"],
                event_type=event["type"],
            )
        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            logger.info(
                "stripe_webhook_payment_intent_failed payment_intent_id=%s",
                payment_intent.get("id"),
            )
            PaymentService._mark_stripe_payment_failed(
                external_id=payment_intent["id"],
                event_type=event["type"],
            )
        else:
            logger.info(
                "stripe_webhook_event_ignored type=%s",
                event["type"],
            )

        return {"received": True}

    @staticmethod
    def _construct_stripe_event(*, payload: bytes, signature: str | None):
        logger.info(
            "stripe_webhook_signature_check configured=%s signature_present=%s",
            bool(Config.STRIPE_WEBHOOK_SECRET),
            bool(signature),
        )

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
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=signature,
                secret=Config.STRIPE_WEBHOOK_SECRET,
            )
            logger.info(
                "stripe_webhook_signature_valid type=%s",
                event["type"],
            )
            return event
        except Exception as exc:
            logger.error(
                "stripe_webhook_signature_invalid error=%s",
                str(exc),
            )
            raise PaymentError(
                code="INVALID_STRIPE_SIGNATURE",
                message=str(exc),
                status_code=400,
            ) from exc

    @staticmethod
    def _create_stripe_checkout_session(*, order: Order, payment: Payment):
        if stripe is None:
            raise PaymentError(
                code="STRIPE_NOT_INSTALLED",
                message="Stripe integration is not installed on the backend.",
                status_code=503,
            )

        if not Config.STRIPE_SECRET_KEY:
            raise PaymentError(
                code="STRIPE_NOT_CONFIGURED",
                message="Stripe payment integration is not configured.",
                status_code=503,
            )

        if not Config.STRIPE_SUCCESS_URL or not Config.STRIPE_CANCEL_URL:
            raise PaymentError(
                code="STRIPE_NOT_CONFIGURED",
                message="Stripe success/cancel URLs are not configured.",
                status_code=503,
            )

        stripe.api_key = Config.STRIPE_SECRET_KEY

        success_separator = "&" if "?" in Config.STRIPE_SUCCESS_URL else "?"
        success_url = (
            f"{Config.STRIPE_SUCCESS_URL}{success_separator}"
            f"order_id={order.id}&session_id={{CHECKOUT_SESSION_ID}}"
        )
        cancel_url = PaymentService._append_query_params(
            Config.STRIPE_CANCEL_URL,
            {
                "order_id": str(order.id),
            },
        )

        logger.info(
            "stripe_checkout_session_urls order_id=%s success_url=%s cancel_url=%s placeholder_present=%s encoded_braces=%s",
            order.id,
            success_url,
            cancel_url,
            "{CHECKOUT_SESSION_ID}" in success_url,
            ("%7B" in success_url or "%7D" in success_url),
        )

        try:
            amount_total = int((Decimal(order.total) * Decimal("100")).quantize(Decimal("1")))
        except Exception as exc:
            raise PaymentError(
                code="INVALID_ORDER_TOTAL",
                message="Order total is invalid for Stripe Checkout.",
                status_code=400,
            ) from exc

        try:
            return stripe.checkout.Session.create(
                mode="payment",
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=order.customer_email,
                metadata={
                    "order_id": str(order.id),
                    "payment_id": str(payment.id),
                },
                line_items=[
                    {
                        "price_data": {
                            "currency": str(order.currency).lower(),
                            "product_data": {
                                "name": f"Pedido MetalWolft #{order.id}",
                            },
                            "unit_amount": amount_total,
                        },
                        "quantity": 1,
                    }
                ],
            )
        except Exception as exc:
            logger.exception(
                "stripe_checkout_session_create_failed order_id=%s payment_id=%s",
                order.id,
                payment.id,
            )
            raise PaymentError(
                code="STRIPE_SESSION_ERROR",
                message=str(exc),
                status_code=502,
            ) from exc

    @staticmethod
    def _create_paypal_checkout_order(*, order: Order, payment: Payment):
        access_token = PaymentService._get_paypal_access_token()

        return_url = PaymentService._append_query_params(
            Config.PAYPAL_SUCCESS_URL,
            {
                "order_id": str(order.id),
            },
        )
        cancel_url = PaymentService._append_query_params(
            Config.PAYPAL_CANCEL_URL,
            {
                "order_id": str(order.id),
            },
        )

        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": str(order.id),
                    "amount": {
                        "currency_code": order.currency,
                        "value": format(Decimal(order.total), "f"),
                    },
                    "description": f"Pedido MetalWolft #{order.id}",
                }
            ],
            "application_context": {
                "return_url": return_url,
                "cancel_url": cancel_url,
                "user_action": "PAY_NOW",
            },
        }

        response = requests.post(
            f"{Config.PAYPAL_BASE_URL}/v2/checkout/orders",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=payload,
            timeout=30,
        )
        data = response.json()

        if not response.ok:
            raise PaymentError(
                code="PAYPAL_CREATE_ORDER_ERROR",
                message=data.get("message") or "Failed to create PayPal order.",
                status_code=502,
            )

        checkout_url = next(
            (link["href"] for link in data.get("links", []) if link.get("rel") == "approve"),
            None,
        )

        if not checkout_url:
            raise PaymentError(
                code="PAYPAL_CREATE_ORDER_ERROR",
                message="PayPal approval URL was not returned.",
                status_code=502,
            )

        logger.info(
            "paypal_checkout_order_created order_id=%s payment_id=%s paypal_order_id=%s return_url=%s cancel_url=%s",
            order.id,
            payment.id,
            data.get("id"),
            return_url,
            cancel_url,
        )

        return {
            "id": data["id"],
            "checkout_url": checkout_url,
        }

    @staticmethod
    def _get_paypal_access_token() -> str:
        if not Config.PAYPAL_CLIENT_ID or not Config.PAYPAL_CLIENT_SECRET:
            raise PaymentError(
                code="PAYPAL_NOT_CONFIGURED",
                message="PayPal integration is not configured.",
                status_code=503,
            )

        response = requests.post(
            f"{Config.PAYPAL_BASE_URL}/v1/oauth2/token",
            headers={
                "Accept": "application/json",
                "Accept-Language": "en_US",
            },
            data={"grant_type": "client_credentials"},
            auth=(Config.PAYPAL_CLIENT_ID, Config.PAYPAL_CLIENT_SECRET),
            timeout=30,
        )
        data = response.json()

        if not response.ok or "access_token" not in data:
            raise PaymentError(
                code="PAYPAL_AUTH_ERROR",
                message=data.get("error_description") or "Failed to authenticate with PayPal.",
                status_code=502,
            )

        return data["access_token"]

    @staticmethod
    def _append_query_params(url: str, params: dict[str, str]) -> str:
        parsed = urlparse(url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        query.update(params)
        return urlunparse(parsed._replace(query=urlencode(query, safe="{}")))

    @staticmethod
    def _mark_stripe_payment_succeeded(
        *,
        external_id: str,
        amount_total,
        currency: str | None,
    ):
        try:
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

            logger.info(
                "stripe_webhook_payment_found external_id=%s order_id=%s payment_id=%s current_payment_status=%s current_order_status=%s",
                external_id,
                payment.order_id,
                payment.id,
                payment.status,
                payment.order.status,
            )

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
            db.session.commit()

            logger.info(
                "stripe_webhook_payment_succeeded external_id=%s order_id=%s payment_id=%s new_payment_status=%s new_order_status=%s",
                external_id,
                payment.order_id,
                payment.id,
                payment.status,
                payment.order.status,
            )
        except PaymentError:
            db.session.rollback()
            raise
        except Exception:
            db.session.rollback()
            logger.exception(
                "stripe_webhook_payment_succeeded_failed external_id=%s",
                external_id,
            )
            raise

    @staticmethod
    def _mark_stripe_payment_failed(*, external_id: str, event_type: str):
        try:
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

            logger.info(
                "stripe_webhook_payment_found_for_failure event_type=%s external_id=%s order_id=%s payment_id=%s current_payment_status=%s current_order_status=%s",
                event_type,
                external_id,
                payment.order_id,
                payment.id,
                payment.status,
                payment.order.status,
            )

            payment.status = "failed"
            if payment.order.status not in PaymentService.FINAL_ORDER_STATUSES:
                payment.order.status = "payment_failed"
            db.session.commit()

            logger.info(
                "stripe_webhook_payment_failed event_type=%s external_id=%s order_id=%s payment_id=%s new_payment_status=%s new_order_status=%s",
                event_type,
                external_id,
                payment.order_id,
                payment.id,
                payment.status,
                payment.order.status,
            )
        except PaymentError:
            db.session.rollback()
            raise
        except Exception:
            db.session.rollback()
            logger.exception(
                "stripe_webhook_payment_failed_handler_error event_type=%s external_id=%s",
                event_type,
                external_id,
            )
            raise

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
