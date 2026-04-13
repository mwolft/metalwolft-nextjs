from datetime import datetime, timezone

from app.extensions import db


class Order(db.Model):
    __tablename__ = "orders"
    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "idempotency_key",
            name="uq_orders_user_idempotency_key",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    idempotency_key = db.Column(db.String(64), nullable=True)

    status = db.Column(db.String(32), nullable=False, default="pending_payment")
    currency = db.Column(db.String(3), nullable=False, default="EUR")

    customer_name = db.Column(db.String(255), nullable=False)
    customer_email = db.Column(db.String(255), nullable=False)
    customer_phone = db.Column(db.String(50), nullable=True)

    shipping_name = db.Column(db.String(255), nullable=False)
    shipping_address_line1 = db.Column(db.String(255), nullable=False)
    shipping_address_line2 = db.Column(db.String(255), nullable=True)
    shipping_city = db.Column(db.String(120), nullable=False)
    shipping_postal_code = db.Column(db.String(32), nullable=False)
    shipping_country = db.Column(db.String(2), nullable=False, default="ES")

    products_subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    shipping_base = db.Column(db.Numeric(10, 2), nullable=False)
    shipping_surcharge = db.Column(db.Numeric(10, 2), nullable=False)
    total = db.Column(db.Numeric(10, 2), nullable=False)

    rules_applied = db.Column(db.JSON, nullable=False, default=list)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    items = db.relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    payments = db.relationship(
        "Payment",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)

    product_slug_snapshot = db.Column(db.String(120), nullable=False)
    product_name_snapshot = db.Column(db.String(255), nullable=False)

    width_cm = db.Column(db.Integer, nullable=False)
    height_cm = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    configuration_snapshot = db.Column(db.JSON, nullable=True)
    options_snapshot = db.Column(db.JSON, nullable=False, default=list)

    unit_area_m2 = db.Column(db.Numeric(10, 4), nullable=False)
    unit_price_m2 = db.Column(db.Numeric(10, 2), nullable=False)
    unit_price_base = db.Column(db.Numeric(10, 2), nullable=False)
    unit_options_modifier = db.Column(db.Numeric(10, 2), nullable=True)
    unit_price = db.Column(db.Numeric(10, 2), nullable=True)
    unit_shipping_surcharge = db.Column(db.Numeric(10, 2), nullable=False)

    products_subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    total = db.Column(db.Numeric(10, 2), nullable=False)

    rules_applied = db.Column(db.JSON, nullable=False, default=list)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    order = db.relationship("Order", back_populates="items")
    product = db.relationship("Product")
