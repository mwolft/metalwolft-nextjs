from app.extensions import db
from datetime import datetime, timezone


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False)

    parent_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    # SEO
    seo_title = db.Column(db.String(180))
    seo_description = db.Column(db.Text)

    # contenido
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))

    # jerarquía
    children = db.relationship(
        "Category",
        backref=db.backref("parent", remote_side=[id]),
        lazy=True
    )

    def __repr__(self):
        return f"<Category {self.id} {self.slug}>"

    def serialize_public_summary(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
        }

    def serialize_public(self):
        active_children = [child for child in self.children if child.is_active]

        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "image_url": self.image_url,
            "parent": (
                self.parent.serialize_public_summary()
                if self.parent and self.parent.is_active
                else None
            ),
            "children_count": len(active_children),
        }


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)

    # identidad
    slug = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)

    # relación SEO
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    category = db.relationship("Category", backref="products")

    # contenido
    description = db.Column(db.Text)
    content = db.Column(db.Text, nullable=False)

    # pricing base
    price_m2 = db.Column(db.Numeric(10, 2), nullable=False)

    # restricciones físicas
    min_width_cm = db.Column(db.Integer, nullable=False)
    max_width_cm = db.Column(db.Integer, nullable=False)
    min_height_cm = db.Column(db.Integer, nullable=False)
    max_height_cm = db.Column(db.Integer, nullable=False)

    # SEO
    seo_title = db.Column(db.String(180))
    seo_description = db.Column(db.Text)
    seo_h1 = db.Column(db.String(180))

    # flags
    is_featured = db.Column(db.Boolean, default=False)
    is_new = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    # media
    main_image = db.Column(db.String(255))

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    def __repr__(self):
        return f"<Product {self.id} {self.slug}>"

    def _get_public_image(self):
        if self.main_image:
            return self.main_image

        ordered_images = sorted(
            self.images,
            key=lambda image: (image.position, image.id or 0)
        )
        main_product_image = next(
            (image for image in ordered_images if image.is_main),
            None
        )

        if main_product_image:
            return main_product_image.url

        if ordered_images:
            return ordered_images[0].url

        return None

    def serialize_public(self, *, include_content=False):
        payload = {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "description": self.description,
            "category": (
                self.category.serialize_public_summary()
                if self.category and self.category.is_active
                else None
            ),
            "image": self._get_public_image(),
            "flags": {
                "featured": self.is_featured,
                "new": self.is_new,
            },
            "seo": {
                "title": self.seo_title,
                "description": self.seo_description,
                "h1": self.seo_h1,
            },
        }

        if include_content:
            payload["content"] = self.content

        return payload


class OptionGroup(db.Model):
    __tablename__ = "option_groups"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)

    # "single" → radio (una opción obligatoria)
    # "multiple" → checkboxes
    type = db.Column(db.String(20), nullable=False)

    sort_order = db.Column(db.Integer, default=0)
    is_required = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<OptionGroup {self.slug}>"


class ProductOption(db.Model):
    __tablename__ = "product_options"

    id = db.Column(db.Integer, primary_key=True)

    group_id = db.Column(db.Integer, db.ForeignKey("option_groups.id"), nullable=False)
    group = db.relationship("OptionGroup", backref="options")

    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), nullable=False)

    price_modifier = db.Column(db.Numeric(10, 2), default=0)

    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f"<ProductOption {self.slug}>"


class ProductOptionAssignment(db.Model):
    __tablename__ = "product_option_assignments"

    id = db.Column(db.Integer, primary_key=True)

    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey("product_options.id"), nullable=False)

    product = db.relationship("Product", backref="option_assignments")
    option = db.relationship("ProductOption")

    def __repr__(self):
        return f"<ProductOptionAssignment p={self.product_id} o={self.option_id}>"


class ProductImage(db.Model):
    __tablename__ = "product_images"

    id = db.Column(db.Integer, primary_key=True)

    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    url = db.Column(db.String(255), nullable=False)
    public_id = db.Column(db.String(255), nullable=False)
    alt_text = db.Column(db.String(255), nullable=True)
    position = db.Column(db.Integer, default=0)
    is_main = db.Column(db.Boolean, default=False)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    product = db.relationship(
        "Product",
        backref=db.backref("images", order_by="ProductImage.position", lazy="selectin")
    )

    def __repr__(self):
        return f"<ProductImage {self.id} p={self.product_id}>"
