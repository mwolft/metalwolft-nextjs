from decimal import Decimal

from app.models.order import Order, OrderItem
from app.extensions import db


class OrderService:

    @staticmethod
    def create_order_from_checkout(*, user, preview: dict):
        """
        Crea el Order (sin items).
        """
        summary = preview["summary"]
        shipping = preview["shipping_address"]
        customer = preview["customer"]

        order = Order(
            user_id=user.id,
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
            products_subtotal=Decimal(summary["items_subtotal"]),
            shipping_base=Decimal(summary["shipping_base"]),
            shipping_surcharge=Decimal(summary["shipping_surcharge"]),
            total=Decimal(summary["grand_total"]),
            rules_applied=[],
        )

        db.session.add(order)
        db.session.flush()  # necesario para tener order.id

        return order

    @staticmethod
    def create_order_items(*, order, preview: dict):
        """
        Crea los OrderItems asociados al Order.
        """
        for item in preview["items"]:
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
                unit_area_m2=Decimal(pricing["unit_area_m2"]),
                unit_price_m2=Decimal(pricing["unit_price_m2"]),
                unit_price_base=Decimal(pricing["unit_price_base"]),
                unit_shipping_surcharge=Decimal(pricing["unit_shipping_surcharge"]),
                products_subtotal=Decimal(pricing["products_subtotal"]),
                total=Decimal(pricing["total"]),
                rules_applied=item.get("rules_applied", []),
            )

            db.session.add(order_item)