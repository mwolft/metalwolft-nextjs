"""add cart items

Revision ID: 6c2d0f5b9a11
Revises: efd9158c60c7
Create Date: 2026-04-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6c2d0f5b9a11'
down_revision = 'efd9158c60c7'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('carts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        'cart_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cart_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('width_cm', sa.Integer(), nullable=False),
        sa.Column('height_cm', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['cart_id'], ['carts.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cart_items_cart_id'), 'cart_items', ['cart_id'], unique=False)
    op.create_index(op.f('ix_cart_items_product_id'), 'cart_items', ['product_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_cart_items_product_id'), table_name='cart_items')
    op.drop_index(op.f('ix_cart_items_cart_id'), table_name='cart_items')
    op.drop_table('cart_items')

    with op.batch_alter_table('carts', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
