"""add configuration hash to cart items

Revision ID: 8c4d5e6f7a8b
Revises: 7b3c2d4e5f6a
Create Date: 2026-04-13 11:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8c4d5e6f7a8b"
down_revision = "7b3c2d4e5f6a"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("cart_items", schema=None) as batch_op:
        batch_op.add_column(sa.Column("configuration_hash", sa.String(length=64), nullable=True))
        batch_op.create_index(
            batch_op.f("ix_cart_items_configuration_hash"),
            ["configuration_hash"],
            unique=False,
        )


def downgrade():
    with op.batch_alter_table("cart_items", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_cart_items_configuration_hash"))
        batch_op.drop_column("configuration_hash")
