from app.models.product import Product
from app.extensions import db


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
        query = Product.query.filter_by(is_active=True)

        if category:
            query = query.filter(Product.category == category)

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
        return Product.query.filter_by(
            slug=slug,
            is_active=True
        ).first()
