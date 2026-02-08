"""add users and carts

Revision ID: 2de1cff7b94d
Revises: abf025812d3b
Create Date: 2026-02-07 18:18:49.128475
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2de1cff7b94d'
down_revision = 'abf025812d3b'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_admin', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_users_email'),
        'users',
        ['email'],
        unique=True
    )

    op.create_table(
        'carts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('anonymous_id', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_carts_anonymous_id'),
        'carts',
        ['anonymous_id'],
        unique=False
    )


def downgrade():
    op.drop_index(op.f('ix_carts_anonymous_id'), table_name='carts')
    op.drop_table('carts')

    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
