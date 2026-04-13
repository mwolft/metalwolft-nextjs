from decimal import Decimal

from app.extensions import db
from app.models.order import Order, OrderItem


class OrderService:
    @staticmethod
    def get_order_by_idempotency_key(*, user_id: int, idempotency_key: str):
        return Order.query.filter_by(
            user_id=user_id,
            idempotency_key=idempotency_key,
        ).first()

    @staticmethod
    def create_order_from_snapshot(*, user, checkout_input: dict, cart_snapshot: dict, idempotency_key: str):
        summary = cart_snapshot["summary"]
        shipping = checkout_input["shipping_address"]
        customer = checkout_input["customer"]

        order = Order(
            user_id=user.id,
            idempotency_key=idempotency_key,
            status="pending_payment",
            currency=summary["currency"],
            customer_name=shipping["name"],
            customer_email=customer["email"],
            customer_phone=None,
            shipping_name=shipping["name"],
            shipping_address_line1=shipping["address_line1"],
            shipping_address_line2=shipping["address_line2"],
            shipping_city=shipping["city"],
            shipping_postal_code=shipping["postal_code"],
            shipping_country=shipping["country"],
            products_subtotal=Decimal(summary["products_subtotal"]),
            shipping_base=Decimal(summary["shipping_base"]),
            shipping_surcharge=Decimal(summary["shipping_surcharge"]),
            total=Decimal(summary["total"]),
            rules_applied=cart_snapshot.get("rules_applied", []),
        )

        db.session.add(order)
        db.session.flush()

        return order

    @staticmethod
    def create_order_items_from_snapshot(*, order, cart_snapshot: dict):
        for item in cart_snapshot["items"]:
            pricing = item["pricing"]
            product = item["product"]
            config = item["configuration"]

            order_item = OrderItem(
                order_id=order.id,
                product_id=product["id"],
                product_slug_snapshot=product["slug"],
                product_name_snapshot=product["name"],
                width_cm=config["width_cm"],
                height_cm=config["height_cm"],
                quantity=config["quantity"],
                configuration_snapshot=config,
                options_snapshot=config.get("options", []),
                unit_area_m2=Decimal(pricing["unit_area_m2"]),
                unit_price_m2=Decimal(pricing["unit_price_m2"]),
                unit_price_base=Decimal(pricing["unit_price_base"]),
                unit_options_modifier=Decimal(pricing["unit_options_modifier"]),
                unit_price=Decimal(pricing["unit_price"]),
                unit_shipping_surcharge=Decimal(pricing["unit_shipping_surcharge"]),
                products_subtotal=Decimal(pricing["products_subtotal"]),
                total=Decimal(pricing["total"]),
                rules_applied=item.get("rules_applied", []),
            )

            db.session.add(order_item)
