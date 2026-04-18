from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.extensions import db
from app.models.cart import Cart, CartItem
from app.services.cart_service import CartService
from app.services.order_service import OrderService
from app.services.pricing_service import PricingError, PricingService


class CheckoutError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class CheckoutService:
    @staticmethod
    def build_checkout_preview(*, user, cart, data: dict):
        try:
            cart_snapshot = CartService.serialize_cart(cart=cart, cart_type="user")
        except PricingError as exc:
            raise CheckoutError(
                code=exc.code,
                message=exc.message,
                status_code=exc.status_code,
            ) from exc

        if not cart_snapshot["items"]:
            raise CheckoutError(
                code="EMPTY_CART",
                message="Cart is empty.",
                status_code=400,
            )

        customer_email = CheckoutService._optional_str(
            data, "customer_email", default=user.email
        )
        customer_note = CheckoutService._optional_str(data, "customer_note")

        shipping_address = {
            "name": CheckoutService._required_str(data, "shipping_name"),
            "address_line1": CheckoutService._required_str(
                data, "shipping_address_line1"
            ),
            "address_line2": CheckoutService._optional_str(
                data, "shipping_address_line2"
            ),
            "city": CheckoutService._required_str(data, "shipping_city"),
            "postal_code": CheckoutService._required_str(
                data, "shipping_postal_code"
            ),
            "country": CheckoutService._optional_str(
                data, "shipping_country", default="ES"
            ).upper(),
        }

        summary = cart_snapshot["summary"]
        validation = {
            "is_valid": True,
            "errors": [],
            "warnings": [],
        }
        meta = {
            "cart_id": cart.id,
            "generated_at": "",
            "calculation_version": "v1",
        }

        return {
            "checkout": {
                "customer": {
                    "email": customer_email,
                    "note": customer_note,
                },
                "shipping_address": shipping_address,
                "items": cart_snapshot["items"],
                "summary": {
                    "currency": cart_snapshot["currency"],
                    "items_subtotal": summary["products_subtotal"],
                    "shipping_base": summary["shipping_base"],
                    "shipping_surcharge": summary["shipping_surcharge"],
                    "shipping_total": str(
                        Decimal(summary["shipping_base"]) + Decimal(summary["shipping_surcharge"])
                    ),
                    "tax_total": "0.00",
                    "discount_total": "0.00",
                    "grand_total": summary["total"],
                },
                "validation": validation,
                "meta": meta,
            }
        }

    @staticmethod
    def _required_str(data: dict, key: str) -> str:
        value = data.get(key)
        if value is None:
            raise CheckoutError(
                code="INVALID_PAYLOAD",
                message=f"{key} is required.",
                status_code=400,
            )

        value = str(value).strip()
        if not value:
            raise CheckoutError(
                code="INVALID_PAYLOAD",
                message=f"{key} cannot be empty.",
                status_code=400,
            )

        return value

    @staticmethod
    def _optional_str(data: dict, key: str, default: str | None = None):
        value = data.get(key, default)
        if value is None:
            return None

        value = str(value).strip()
        return value or None

    @staticmethod
    def _serialize_decimal(value, precision: int = 2):
        quantizer = Decimal("1").scaleb(-precision)
        return format(
            Decimal(value).quantize(quantizer, rounding=ROUND_HALF_UP),
            "f"
        )

    @staticmethod
    def serialize_order(order):
        return {
            "order": {
                "id": order.id,
                "status": order.status,
                "currency": order.currency,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "customer": {
                    "name": order.customer_name,
                    "email": order.customer_email,
                    "phone": order.customer_phone,
                },
                "shipping_address": {
                    "name": order.shipping_name,
                    "address_line1": order.shipping_address_line1,
                    "address_line2": order.shipping_address_line2,
                    "city": order.shipping_city,
                    "postal_code": order.shipping_postal_code,
                    "country": order.shipping_country,
                },
                "summary": {
                    "products_subtotal": str(order.products_subtotal),
                    "shipping_base": str(order.shipping_base),
                    "shipping_surcharge": str(order.shipping_surcharge),
                    "total": str(order.total),
                },
                "payments": [
                    {
                        "id": payment.id,
                        "provider": payment.provider,
                        "status": payment.status,
                        "amount": str(payment.amount),
                        "currency": payment.currency,
                        "external_id": payment.external_id,
                        "reference": payment.reference,
                    }
                    for payment in order.payments
                ],
                "items": [
                    {
                        "id": item.id,
                        "product": {
                            "id": item.product_id,
                            "slug": item.product_slug_snapshot,
                            "name": item.product_name_snapshot,
                        },
                        "configuration": {
                            **(item.configuration_snapshot or {
                                "width_cm": item.width_cm,
                                "height_cm": item.height_cm,
                                "options": item.options_snapshot or [],
                            }),
                            "quantity": item.quantity,
                        },
                        "pricing": {
                            "unit_price_base": str(item.unit_price_base),
                            "unit_options_modifier": str(item.unit_options_modifier or "0.00"),
                            "unit_price": str(item.unit_price or item.unit_price_base),
                            "products_subtotal": str(item.products_subtotal),
                            "total": str(item.total),
                        },
                    }
                    for item in order.items
                ],
            }
        }

    @staticmethod
    def confirm_checkout(*, user, cart, checkout_data: dict):
        checkout_input = CheckoutService._normalize_confirm_input(
            user=user,
            checkout_data=checkout_data,
        )
        idempotency_key = checkout_input["idempotency_key"]

        try:
            locked_cart = CheckoutService._get_locked_cart_for_user(user_id=user.id)

            existing_order = OrderService.get_order_by_idempotency_key(
                user_id=user.id,
                idempotency_key=idempotency_key,
            )
            if existing_order:
                return {
                    "order_id": existing_order.id,
                    "status": existing_order.status,
                }

            if not locked_cart or not locked_cart.items:
                raise CheckoutError(
                    code="EMPTY_CART",
                    message="Cart is empty.",
                    status_code=400,
                )

            cart_snapshot = CheckoutService._build_cart_snapshot_from_cart(
                cart=locked_cart,
            )

            order = OrderService.create_order_from_snapshot(
                user=user,
                checkout_input=checkout_input,
                cart_snapshot=cart_snapshot,
                idempotency_key=idempotency_key,
            )

            OrderService.create_order_items_from_snapshot(
                order=order,
                cart_snapshot=cart_snapshot,
            )

            (
                db.session.query(CartItem)
                .filter_by(cart_id=locked_cart.id)
                .delete(synchronize_session=False)
            )

            db.session.flush()
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            existing_order = OrderService.get_order_by_idempotency_key(
                user_id=user.id,
                idempotency_key=idempotency_key,
            )
            if existing_order:
                return {
                    "order_id": existing_order.id,
                    "status": existing_order.status,
                }
            raise
        except Exception:
            db.session.rollback()
            raise

        return {
            "order_id": order.id,
            "status": order.status,
        }

    @staticmethod
    def _normalize_confirm_input(*, user, checkout_data: dict) -> dict:
        idempotency_key = CheckoutService._required_str(checkout_data, "idempotency_key")
        customer_email = CheckoutService._optional_str(
            checkout_data, "customer_email", default=user.email
        )
        customer_note = CheckoutService._optional_str(checkout_data, "customer_note")

        shipping_address = {
            "name": CheckoutService._required_str(checkout_data, "shipping_name"),
            "address_line1": CheckoutService._required_str(
                checkout_data, "shipping_address_line1"
            ),
            "address_line2": CheckoutService._optional_str(
                checkout_data, "shipping_address_line2"
            ),
            "city": CheckoutService._required_str(checkout_data, "shipping_city"),
            "postal_code": CheckoutService._required_str(
                checkout_data, "shipping_postal_code"
            ),
            "country": CheckoutService._optional_str(
                checkout_data, "shipping_country", default="ES"
            ).upper(),
        }

        return {
            "idempotency_key": idempotency_key,
            "customer": {
                "email": customer_email,
                "note": customer_note,
            },
            "shipping_address": shipping_address,
        }

    @staticmethod
    def _get_locked_cart_for_user(*, user_id: int):
        return (
            Cart.query
            .options(selectinload(Cart.items).selectinload(CartItem.product))
            .filter_by(user_id=user_id)
            .with_for_update()
            .first()
        )

    @staticmethod
    def _build_cart_snapshot_from_cart(*, cart):
        items = []
        products_subtotal = Decimal("0.00")
        shipping_surcharge = Decimal("0.00")
        rules_applied = []
        total_quantity = 0

        for item in cart.items:
            configuration = CartService.normalize_configuration(
                configuration=item.configuration,
                width_cm=item.width_cm,
                height_cm=item.height_cm,
            )
            quote = PricingService.quote(
                product_id=item.product_id,
                configuration=configuration,
                quantity=item.quantity,
            )
            item_products_subtotal = Decimal(quote["pricing"]["products_subtotal"])
            item_shipping_surcharge = Decimal(quote["pricing"]["shipping_surcharge"])
            item_total = item_products_subtotal + item_shipping_surcharge

            items.append({
                "id": item.id,
                "product": quote["product"],
                "configuration": {
                    **configuration,
                    "quantity": item.quantity,
                },
                "pricing": {
                    **quote["pricing"],
                    "shipping_base": PricingService._serialize_decimal(Decimal("0.00")),
                    "total": PricingService._serialize_decimal(item_total),
                },
                "rules_applied": quote["rules_applied"],
            })

            products_subtotal += item_products_subtotal
            shipping_surcharge += item_shipping_surcharge
            rules_applied.extend(quote["rules_applied"])
            total_quantity += item.quantity

        shipping_base, shipping_rule = PricingService._calculate_shipping_base(
            products_subtotal
        )
        total = products_subtotal + shipping_base + shipping_surcharge

        if shipping_rule:
            rules_applied.append(shipping_rule)

        return {
            "cart_id": cart.id,
            "items": items,
            "summary": {
                "items_count": len(items),
                "total_quantity": total_quantity,
                "products_subtotal": PricingService._serialize_decimal(products_subtotal),
                "shipping_base": PricingService._serialize_decimal(shipping_base),
                "shipping_surcharge": PricingService._serialize_decimal(shipping_surcharge),
                "total": PricingService._serialize_decimal(total),
                "currency": "EUR",
            },
            "rules_applied": sorted(set(rules_applied)),
            "currency": "EUR",
        }
