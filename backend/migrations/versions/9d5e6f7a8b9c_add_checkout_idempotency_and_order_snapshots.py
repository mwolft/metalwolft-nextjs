"""add checkout idempotency and order snapshots

Revision ID: 9d5e6f7a8b9c
Revises: 8c4d5e6f7a8b
Create Date: 2026-04-13 12:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9d5e6f7a8b9c"
down_revision = "8c4d5e6f7a8b"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("orders", schema=None) as batch_op:
        batch_op.add_column(sa.Column("idempotency_key", sa.String(length=64), nullable=True))
        batch_op.create_unique_constraint(
            "uq_orders_user_idempotency_key",
            ["user_id", "idempotency_key"],
        )

    with op.batch_alter_table("order_items", schema=None) as batch_op:
        batch_op.add_column(sa.Column("configuration_snapshot", sa.JSON(), nullable=True))
        batch_op.add_column(
            sa.Column("unit_options_modifier", sa.Numeric(precision=10, scale=2), nullable=True)
        )
        batch_op.add_column(sa.Column("unit_price", sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade():
    with op.batch_alter_table("order_items", schema=None) as batch_op:
        batch_op.drop_column("unit_price")
        batch_op.drop_column("unit_options_modifier")
        batch_op.drop_column("configuration_snapshot")

    with op.batch_alter_table("orders", schema=None) as batch_op:
        batch_op.drop_constraint("uq_orders_user_idempotency_key", type_="unique")
        batch_op.drop_column("idempotency_key")
