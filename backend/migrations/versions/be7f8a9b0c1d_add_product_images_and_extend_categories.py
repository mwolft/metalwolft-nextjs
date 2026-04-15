"""add product images and extend categories

Revision ID: be7f8a9b0c1d
Revises: ad6e7f8a9b0c
Create Date: 2026-04-15 10:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "be7f8a9b0c1d"
down_revision = "ad6e7f8a9b0c"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("categories", schema=None) as batch_op:
        batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=True, server_default=sa.true()))
        batch_op.add_column(sa.Column("created_at", sa.DateTime(timezone=True), nullable=True))

    with op.batch_alter_table("products", schema=None) as batch_op:
        batch_op.alter_column(
            "category_id",
            existing_type=sa.Integer(),
            nullable=True,
        )

    op.create_table(
        "product_images",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("url", sa.String(length=255), nullable=False),
        sa.Column("public_id", sa.String(length=255), nullable=False),
        sa.Column("alt_text", sa.String(length=255), nullable=True),
        sa.Column("position", sa.Integer(), nullable=True),
        sa.Column("is_main", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("product_images", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_product_images_product_id"), ["product_id"], unique=False)


def downgrade():
    with op.batch_alter_table("product_images", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_product_images_product_id"))

    op.drop_table("product_images")

    with op.batch_alter_table("products", schema=None) as batch_op:
        batch_op.alter_column(
            "category_id",
            existing_type=sa.Integer(),
            nullable=False,
        )

    with op.batch_alter_table("categories", schema=None) as batch_op:
        batch_op.drop_column("created_at")
        batch_op.drop_column("is_active")
