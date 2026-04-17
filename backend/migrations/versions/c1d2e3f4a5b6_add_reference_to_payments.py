"""add reference to payments

Revision ID: c1d2e3f4a5b6
Revises: be7f8a9b0c1d
Create Date: 2026-04-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c1d2e3f4a5b6"
down_revision = "be7f8a9b0c1d"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("payments", schema=None) as batch_op:
        batch_op.add_column(sa.Column("reference", sa.String(length=64), nullable=True))


def downgrade():
    with op.batch_alter_table("payments", schema=None) as batch_op:
        batch_op.drop_column("reference")
