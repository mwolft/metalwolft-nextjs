from app.extensions import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False)

    parent_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)

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


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)

    # identidad
    slug = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)

    # relación SEO
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
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