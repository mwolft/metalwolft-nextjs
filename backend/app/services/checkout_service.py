from decimal import Decimal, ROUND_HALF_UP

from app.services.cart_service import CartService
from app.services.pricing_service import PricingError


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

        # ---- INPUT ----
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

        # ---- SUMMARY ----
        summary = cart_snapshot["summary"]

        # ---- VALIDATION ----
        validation = {
            "is_valid": True,
            "errors": [],
            "warnings": [],
        }

        # ---- META ----
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
                "items": [
                    {
                        "id": item.id,
                        "product": {
                            "id": item.product_id,
                            "slug": item.product_slug_snapshot,
                            "name": item.product_name_snapshot,
                        },
                        "configuration": {
                            "width_cm": item.width_cm,
                            "height_cm": item.height_cm,
                            "quantity": item.quantity,
                        },
                        "pricing": {
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
        preview = checkout_data

        current_preview = CheckoutService.build_checkout_preview(
            user=user,
            cart=cart,
            data={
                "shipping_name": preview["shipping_address"]["name"],
                "shipping_address_line1": preview["shipping_address"]["address_line1"],
                "shipping_address_line2": preview["shipping_address"]["address_line2"],
                "shipping_city": preview["shipping_address"]["city"],
                "shipping_postal_code": preview["shipping_address"]["postal_code"],
                "shipping_country": preview["shipping_address"]["country"],
            }
        )["checkout"]

        from app.services.checkout_validator import CheckoutValidator
        from app.services.order_service import OrderService
        from app.extensions import db

        # 🔐 VALIDACIÓN
        CheckoutValidator.validate(preview, current_preview)

        # 🧾 CREACIÓN DE PEDIDO
        order = OrderService.create_order_from_checkout(
            user=user,
            preview=preview,
        )

        OrderService.create_order_items(
            order=order,
            preview=preview,
        )

        db.session.commit()

        # 🧹 LIMPIEZA DE CARRITO
        for item in cart.items:
            db.session.delete(item)

        db.session.commit()

        return {
            "order_id": order.id,
            "status": order.status,
        }