from app.extensions import db

class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)

    # Identidad
    slug = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)

    # Categoría funcional (no tabla aparte)
    category = db.Column(
        db.Enum("fijas", "abatibles", "correderas", name="product_category"),
        nullable=False
    )

    # Contenido
    description = db.Column(db.Text, nullable=False)

    # SEO
    seo_title = db.Column(db.String(180), nullable=True)
    seo_description = db.Column(db.Text, nullable=True)
    seo_h1 = db.Column(db.String(180), nullable=True)

    # Flags de negocio
    is_featured = db.Column(db.Boolean, default=False)
    is_new = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    # Imagen principal (simple por ahora)
    main_image = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f"<Product {self.id} {self.slug}>"

    def serialize(self):
        """
        Serialización básica para frontend.
        NO incluye precio.
        """
        return {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "seo": {
                "title": self.seo_title,
                "description": self.seo_description,
                "h1": self.seo_h1,
            },
            "flags": {
                "featured": self.is_featured,
                "new": self.is_new,
            },
            "image": self.main_image,
        }
