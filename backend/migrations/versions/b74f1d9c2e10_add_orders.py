"""add orders

Revision ID: b74f1d9c2e10
Revises: 6c2d0f5b9a11
Create Date: 2026-04-08 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b74f1d9c2e10'
down_revision = '6c2d0f5b9a11'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('customer_name', sa.String(length=255), nullable=False),
        sa.Column('customer_email', sa.String(length=255), nullable=False),
        sa.Column('customer_phone', sa.String(length=50), nullable=True),
        sa.Column('shipping_name', sa.String(length=255), nullable=False),
        sa.Column('shipping_address_line1', sa.String(length=255), nullable=False),
        sa.Column('shipping_address_line2', sa.String(length=255), nullable=True),
        sa.Column('shipping_city', sa.String(length=120), nullable=False),
        sa.Column('shipping_postal_code', sa.String(length=32), nullable=False),
        sa.Column('shipping_country', sa.String(length=2), nullable=False),
        sa.Column('products_subtotal', sa.Numeric(10, 2), nullable=False),
        sa.Column('shipping_base', sa.Numeric(10, 2), nullable=False),
        sa.Column('shipping_surcharge', sa.Numeric(10, 2), nullable=False),
        sa.Column('total', sa.Numeric(10, 2), nullable=False),
        sa.Column('rules_applied', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_orders_user_id'), 'orders', ['user_id'], unique=False)

    op.create_table(
        'order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('product_slug_snapshot', sa.String(length=120), nullable=False),
        sa.Column('product_name_snapshot', sa.String(length=255), nullable=False),
        sa.Column('width_cm', sa.Integer(), nullable=False),
        sa.Column('height_cm', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_area_m2', sa.Numeric(10, 4), nullable=False),
        sa.Column('unit_price_m2', sa.Numeric(10, 2), nullable=False),
        sa.Column('unit_price_base', sa.Numeric(10, 2), nullable=False),
        sa.Column('unit_shipping_surcharge', sa.Numeric(10, 2), nullable=False),
        sa.Column('products_subtotal', sa.Numeric(10, 2), nullable=False),
        sa.Column('total', sa.Numeric(10, 2), nullable=False),
        sa.Column('rules_applied', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_items_order_id'), 'order_items', ['order_id'], unique=False)
    op.create_index(op.f('ix_order_items_product_id'), 'order_items', ['product_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_order_items_product_id'), table_name='order_items')
    op.drop_index(op.f('ix_order_items_order_id'), table_name='order_items')
    op.drop_table('order_items')

    op.drop_index(op.f('ix_orders_user_id'), table_name='orders')
    op.drop_table('orders')
