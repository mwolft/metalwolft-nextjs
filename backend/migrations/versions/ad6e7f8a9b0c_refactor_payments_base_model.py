"""refactor payments base model

Revision ID: ad6e7f8a9b0c
Revises: 9d5e6f7a8b9c
Create Date: 2026-04-13 13:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "ad6e7f8a9b0c"
down_revision = "9d5e6f7a8b9c"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("payments", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_payments_provider_reference"))
        batch_op.drop_column("method")
        batch_op.drop_column("provider_reference")
        batch_op.add_column(sa.Column("currency", sa.String(length=3), nullable=False, server_default="EUR"))
        batch_op.add_column(sa.Column("external_id", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("idempotency_key", sa.String(length=64), nullable=False, server_default=""))
        batch_op.create_index(batch_op.f("ix_payments_idempotency_key"), ["idempotency_key"], unique=False)


def downgrade():
    with op.batch_alter_table("payments", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_payments_idempotency_key"))
        batch_op.drop_column("idempotency_key")
        batch_op.drop_column("external_id")
        batch_op.drop_column("currency")
        batch_op.add_column(sa.Column("provider_reference", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("method", sa.String(length=32), nullable=False, server_default="stripe"))
        batch_op.create_index(batch_op.f("ix_payments_provider_reference"), ["provider_reference"], unique=False)
