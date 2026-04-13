"""add configuration to cart items

Revision ID: 7b3c2d4e5f6a
Revises: 3afbd8a2472a
Create Date: 2026-04-13 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "7b3c2d4e5f6a"
down_revision = "3afbd8a2472a"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("cart_items", schema=None) as batch_op:
        batch_op.add_column(sa.Column("configuration", sa.JSON(), nullable=True))


def downgrade():
    with op.batch_alter_table("cart_items", schema=None) as batch_op:
        batch_op.drop_column("configuration")
