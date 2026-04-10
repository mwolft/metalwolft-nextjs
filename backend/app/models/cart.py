from datetime import datetime, timezone
from app.extensions import db


class Cart(db.Model):
    __tablename__ = "carts"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    anonymous_id = db.Column(db.String(64), nullable=True, index=True)

    items = db.relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )


class CartItem(db.Model):
    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True)

    cart_id = db.Column(db.Integer, db.ForeignKey("carts.id"), nullable=False, index=True)
    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False,
        index=True,
    )

    width_cm = db.Column(db.Integer, nullable=False)
    height_cm = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    cart = db.relationship("Cart", back_populates="items")
    product = db.relationship("Product")
