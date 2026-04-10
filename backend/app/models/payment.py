from datetime import datetime, timezone

from app.extensions import db


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)

    method = db.Column(db.String(32), nullable=False)
    status = db.Column(db.String(32), nullable=False, default="pending")
    provider = db.Column(db.String(32), nullable=False)
    provider_reference = db.Column(db.String(255), nullable=True, index=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    order = db.relationship("Order", back_populates="payments")
