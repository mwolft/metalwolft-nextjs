from decimal import Decimal, ROUND_HALF_UP

from app.extensions import db
from app.models.order import Order, OrderItem
from app.services.cart_service import CartService
from app.services.payment_service import PaymentService
from app.services.pricing_service import PricingError


class CheckoutError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class CheckoutService:
    @staticmethod
    def create_order(*, user, cart, data: dict):
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

        customer_name = CheckoutService._required_str(data, "customer_name")
        customer_email = CheckoutService._optional_str(
            data, "customer_email", default=user.email
        )
        customer_phone = CheckoutService._optional_str(data, "customer_phone")

        shipping_name = CheckoutService._optional_str(
            data, "shipping_name", default=customer_name
        )
        shipping_address_line1 = CheckoutService._required_str(
            data, "shipping_address_line1"
        )
        shipping_address_line2 = CheckoutService._optional_str(
            data, "shipping_address_line2"
        )
        shipping_city = CheckoutService._required_str(data, "shipping_city")
        shipping_postal_code = CheckoutService._required_str(
            data, "shipping_postal_code"
        )
        shipping_country = CheckoutService._optional_str(
            data, "shipping_country", default="ES"
        ).upper()

        order = Order(
            user_id=user.id,
            status="pending_payment",
            currency=cart_snapshot["currency"],
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            shipping_name=shipping_name,
            shipping_address_line1=shipping_address_line1,
            shipping_address_line2=shipping_address_line2,
            shipping_city=shipping_city,
            shipping_postal_code=shipping_postal_code,
            shipping_country=shipping_country,
            products_subtotal=Decimal(cart_snapshot["summary"]["products_subtotal"]),
            shipping_base=Decimal(cart_snapshot["summary"]["shipping_base"]),
            shipping_surcharge=Decimal(cart_snapshot["summary"]["shipping_surcharge"]),
            total=Decimal(cart_snapshot["summary"]["total"]),
            rules_applied=cart_snapshot["rules_applied"],
        )
        db.session.add(order)
        db.session.flush()

        for item_snapshot in cart_snapshot["items"]:
            item_pricing = item_snapshot["pricing"]
            product_snapshot = item_snapshot["product"]
            configuration = item_snapshot["configuration"]

            order_item = OrderItem(
                order_id=order.id,
                product_id=product_snapshot["id"],
                product_slug_snapshot=product_snapshot["slug"],
                product_name_snapshot=product_snapshot["name"],
                width_cm=configuration["width_cm"],
                height_cm=configuration["height_cm"],
                quantity=configuration["quantity"],
                unit_area_m2=Decimal(item_pricing["unit_area_m2"]),
                unit_price_m2=Decimal(item_pricing["unit_price_m2"]),
                unit_price_base=Decimal(item_pricing["unit_price_base"]),
                unit_shipping_surcharge=Decimal(
                    item_pricing["unit_shipping_surcharge"]
                ),
                products_subtotal=Decimal(item_pricing["products_subtotal"]),
                total=Decimal(item_pricing["total"]),
                rules_applied=item_snapshot["rules_applied"],
            )
            db.session.add(order_item)

        db.session.commit()

        return CheckoutService.serialize_order(order)

    @staticmethod
    def serialize_order(order: Order):
        order = (
            Order.query
            .filter_by(id=order.id)
            .first()
        )

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
                    "products_subtotal": CheckoutService._serialize_decimal(
                        order.products_subtotal
                    ),
                    "shipping_base": CheckoutService._serialize_decimal(
                        order.shipping_base
                    ),
                    "shipping_surcharge": CheckoutService._serialize_decimal(
                        order.shipping_surcharge
                    ),
                    "total": CheckoutService._serialize_decimal(order.total),
                },
                "rules_applied": order.rules_applied,
                "payments": [
                    PaymentService.serialize_payment(payment)
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
                            "width_cm": item.width_cm,
                            "height_cm": item.height_cm,
                            "quantity": item.quantity,
                        },
                        "pricing": {
                            "unit_area_m2": CheckoutService._serialize_decimal(
                                item.unit_area_m2, precision=4
                            ),
                            "unit_price_m2": CheckoutService._serialize_decimal(
                                item.unit_price_m2
                            ),
                            "unit_price_base": CheckoutService._serialize_decimal(
                                item.unit_price_base
                            ),
                            "unit_shipping_surcharge": CheckoutService._serialize_decimal(
                                item.unit_shipping_surcharge
                            ),
                            "products_subtotal": CheckoutService._serialize_decimal(
                                item.products_subtotal
                            ),
                            "total": CheckoutService._serialize_decimal(item.total),
                        },
                        "rules_applied": item.rules_applied,
                    }
                    for item in order.items
                ],
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
