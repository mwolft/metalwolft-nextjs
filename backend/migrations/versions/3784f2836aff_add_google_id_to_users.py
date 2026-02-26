"""add google_id to users

Revision ID: 3784f2836aff
Revises: 2de1cff7b94d
Create Date: 2026-02-08 08:56:20.291971

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3784f2836aff'
down_revision = '2de1cff7b94d'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'users',
        sa.Column('google_id', sa.String(length=255), nullable=True)
    )



def downgrade():
    op.drop_column('users', 'google_id')

