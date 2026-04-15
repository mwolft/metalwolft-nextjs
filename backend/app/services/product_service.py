from sqlalchemy.orm import selectinload

from app.models.product import Category, Product


class ProductService:
    """
    Dominio de productos públicos.
    """

    @staticmethod
    def get_public_products(category=None):
        """
        Devuelve productos activos y públicos.
        Opcionalmente filtrados por categoría.
        """
        query = (
            Product.query
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )
            .filter(Product.is_active.is_(True))
        )

        if category:
            query = query.join(Product.category).filter(
                Category.slug == category,
                Category.is_active.is_(True),
            )

        return (
            query
            .order_by(
                Product.is_featured.desc(),
                Product.created_at.desc()
            )
            .all()
        )

    @staticmethod
    def get_public_product_by_slug(slug: str):
        """
        Devuelve un producto activo por slug o None.
        """
        return (
            Product.query
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
            )
            .filter_by(
                slug=slug,
                is_active=True
            )
            .first()
        )

    @staticmethod
    def get_public_root_categories():
        return (
            Category.query
            .options(
                selectinload(Category.children),
                selectinload(Category.parent),
            )
            .filter(
                Category.is_active.is_(True),
                Category.parent_id.is_(None),
            )
            .order_by(Category.name.asc())
            .all()
        )
