"""add payments

Revision ID: c91e3f4d7a22
Revises: b74f1d9c2e10
Create Date: 2026-04-08 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c91e3f4d7a22'
down_revision = 'b74f1d9c2e10'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('method', sa.String(length=32), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('provider', sa.String(length=32), nullable=False),
        sa.Column('provider_reference', sa.String(length=255), nullable=True),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payments_order_id'), 'payments', ['order_id'], unique=False)
    op.create_index(op.f('ix_payments_provider_reference'), 'payments', ['provider_reference'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_payments_provider_reference'), table_name='payments')
    op.drop_index(op.f('ix_payments_order_id'), table_name='payments')
    op.drop_table('payments')
