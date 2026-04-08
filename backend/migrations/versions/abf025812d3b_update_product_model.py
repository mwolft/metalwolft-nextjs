"""update product model

Revision ID: abf025812d3b
Revises: c731cdb5fd35
Create Date: 2026-01-27 19:19:37.005878

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'abf025812d3b'
down_revision = 'c731cdb5fd35'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('content', sa.Text(), nullable=False, server_default='')
        )
        batch_op.add_column(
            sa.Column('price_m2', sa.Numeric(10, 2), nullable=False, server_default='0')
        )
        batch_op.add_column(
            sa.Column('min_width_cm', sa.Integer(), nullable=False, server_default='40')
        )
        batch_op.add_column(
            sa.Column('max_width_cm', sa.Integer(), nullable=False, server_default='240')
        )
        batch_op.add_column(
            sa.Column('min_height_cm', sa.Integer(), nullable=False, server_default='40')
        )
        batch_op.add_column(
            sa.Column('max_height_cm', sa.Integer(), nullable=False, server_default='240')
        )


def downgrade():
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.drop_column('max_height_cm')
        batch_op.drop_column('min_height_cm')
        batch_op.drop_column('max_width_cm')
        batch_op.drop_column('min_width_cm')
        batch_op.drop_column('price_m2')
        batch_op.drop_column('content')
