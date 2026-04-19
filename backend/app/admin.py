from flask import flash
from flask_admin.actions import action
from flask_admin.contrib.sqla import ModelView
from markupsafe import Markup, escape
from wtforms import FileField

from app.extensions import db
from app.models.cart import Cart, CartItem
from app.models.order import Order
from app.models.payment import Payment
from app.models.product import Category, Product, ProductImage
from app.models.user import User
from app.services.payment_service import PaymentService
from app.utils.cloudinary_service import delete_image, upload_image


def _ensure_single_main_product_image(*, product_id: int):
    if not product_id:
        return

    ordered_images = (
        ProductImage.query
        .filter_by(product_id=product_id)
        .order_by(ProductImage.position.asc(), ProductImage.id.asc())
        .all()
    )

    if not ordered_images:
        return

    main_images = [image for image in ordered_images if image.is_main]
    canonical_main = main_images[0] if main_images else ordered_images[0]

    for image in ordered_images:
        image.is_main = image.id == canonical_main.id


def _validate_product_image(model):
    if model.url and not model.public_id:
        raise ValueError("public_id is required when url is set.")


def _render_image_preview(url):
    if not url:
        return "-"

    return Markup(f'<img src="{url}" style="height:50px;" alt="preview">')


def _populate_product_image_from_upload(form, model):
    uploaded_file = getattr(form, "file", None)
    file_data = getattr(uploaded_file, "data", None)

    if not file_data or not getattr(file_data, "filename", None):
        return

    old_public_id = model.public_id
    folder = f"metalwolft/products/{model.product_id or 'unassigned'}"
    upload_result = upload_image(file_data, folder=folder)
    model.url = upload_result["url"]
    model.public_id = upload_result["public_id"]

    if old_public_id and old_public_id != model.public_id:
        delete_image(old_public_id)


def _get_order_item_configuration(model):
    configuration = model.configuration_snapshot or {}

    return {
        "width_cm": configuration.get("width_cm", model.width_cm),
        "height_cm": configuration.get("height_cm", model.height_cm),
        "quantity": configuration.get("quantity", model.quantity),
        "anchoring_type": configuration.get("anchoring_type"),
        "color": configuration.get("color"),
    }


def _format_anchoring_type(value):
    anchoring_labels = {
        "interior_holes": "Sin obra con agujeros interiores",
        "frontal_holes": "Sin obra con agujeros frontales",
        "plates": "Sin obra con pletinas",
        "side_claws": "Con obra con garras metalicas laterales",
        "front_claws": "Con obra con garras frontales",
    }

    if not value:
        return "-"

    return anchoring_labels.get(value, value)


def _format_color(value):
    color_labels = {
        "white": "Blanco",
        "black": "Negro",
        "anthracite": "Antracita",
        "green": "Verde",
    }

    if not value:
        return "-"

    return color_labels.get(value, value)


def _format_money(amount, currency):
    return f"{amount} {currency or 'EUR'}"


def _render_order_items_summary(items):
    if not items:
        return "-"

    blocks = []

    for item in items:
        configuration = _get_order_item_configuration(item)
        product_name = escape(item.product_name_snapshot or f"Producto #{item.product_id}")
        dimensions = f"{configuration['width_cm']} x {configuration['height_cm']} cm"
        quantity = escape(str(configuration["quantity"]))
        anchoring = escape(_format_anchoring_type(configuration["anchoring_type"]))
        color = escape(_format_color(configuration["color"]))

        blocks.append(
            (
                '<div style="margin-bottom:10px;padding:10px 12px;'
                'border:1px solid #d1d5db;border-radius:8px;background:#f9fafb;">'
                f'<div style="font-weight:600;margin-bottom:4px;">{product_name}</div>'
                f'<div>{escape(dimensions)} | Cantidad: {quantity}</div>'
                f'<div>Anclaje: {anchoring}</div>'
                f'<div>Color: {color}</div>'
                "</div>"
            )
        )

    return Markup("".join(blocks))


class UserAdmin(ModelView):
    column_list = ("id", "email", "is_active", "is_admin", "created_at")
    column_searchable_list = ("email",)
    column_filters = ("is_active", "is_admin")
    can_create = False
    can_edit = False
    can_delete = False


class CategoryAdmin(ModelView):
    column_list = (
        "id",
        "name",
        "slug",
        "parent",
        "is_active",
        "seo_title",
        "image_url",
        "created_at",
    )
    column_details_list = (
        "id",
        "name",
        "slug",
        "parent",
        "is_active",
        "seo_title",
        "seo_description",
        "description",
        "image_url",
        "created_at",
    )
    column_filters = ("is_active", "created_at")
    column_searchable_list = ("name", "slug")
    form_columns = (
        "name",
        "slug",
        "parent",
        "description",
        "image_url",
        "seo_title",
        "seo_description",
        "is_active",
    )
    can_view_details = True
    column_labels = {
        "name": "Nombre",
        "slug": "Slug",
        "parent": "Padre",
        "description": "Descripcion",
        "image_url": "Imagen",
        "seo_title": "SEO title",
        "seo_description": "SEO description",
        "is_active": "Activa",
        "created_at": "Creada",
    }


class ProductAdmin(ModelView):
    column_list = (
        "id",
        "name",
        "category",
        "price_m2",
        "is_active",
        "is_featured",
        "created_at",
    )
    column_filters = ("category", "is_active", "is_featured", "is_new")
    column_searchable_list = ("name", "slug")
    inline_models = [(
        ProductImage,
        dict(
            form_columns=("url", "public_id", "alt_text", "position", "is_main"),
            column_list=("preview", "url", "public_id", "position", "is_main"),
            column_formatters={
                "preview": lambda _v, _c, model, _p: _render_image_preview(model.url),
            },
        )
    )]
    form_columns = (
        "slug",
        "name",
        "category_id",
        "category",
        "description",
        "content",
        "price_m2",
        "min_width_cm",
        "max_width_cm",
        "min_height_cm",
        "max_height_cm",
        "seo_title",
        "seo_description",
        "seo_h1",
        "is_featured",
        "is_new",
        "is_active",
        "main_image",
    )
    column_labels = {
        "name": "Nombre",
        "slug": "Slug",
        "category": "Categoria",
        "description": "Descripcion",
        "content": "Contenido",
        "price_m2": "Precio €/m²",
        "min_width_cm": "Ancho minimo (cm)",
        "max_width_cm": "Ancho maximo (cm)",
        "min_height_cm": "Alto minimo (cm)",
        "max_height_cm": "Alto maximo (cm)",
        "seo_title": "SEO title",
        "seo_description": "SEO description",
        "seo_h1": "SEO H1",
        "is_featured": "Destacado",
        "is_new": "Nuevo",
        "is_active": "Activo",
        "main_image": "Imagen principal",
        "created_at": "Creado",
        "updated_at": "Actualizado",
    }
    column_default_sort = ("created_at", True)

    def on_model_change(self, form, model, is_created):
        for image in getattr(model, "images", []) or []:
            _validate_product_image(image)
        super().on_model_change(form, model, is_created)

    def after_model_change(self, form, model, is_created):
        _ensure_single_main_product_image(product_id=model.id)
        super().after_model_change(form, model, is_created)


class ProductImageAdmin(ModelView):
    form_extra_fields = {
        "file": FileField("file"),
    }
    column_list = (
        "id",
        "product_id",
        "preview",
        "url",
        "is_main",
        "position",
        "created_at",
    )
    column_filters = ("is_main", "created_at")
    column_searchable_list = ("product_id", "url")
    form_columns = (
        "product",
        "file",
        "url",
        "public_id",
        "alt_text",
        "position",
        "is_main",
    )
    column_default_sort = ("position", False)
    column_formatters = {
        "preview": lambda _v, _c, model, _p: _render_image_preview(model.url),
    }

    def on_model_change(self, form, model, is_created):
        _populate_product_image_from_upload(form, model)
        _validate_product_image(model)
        super().on_model_change(form, model, is_created)

    def after_model_change(self, form, model, is_created):
        _ensure_single_main_product_image(product_id=model.product_id)
        super().after_model_change(form, model, is_created)

    def delete_model(self, model):
        public_id = model.public_id
        was_deleted = super().delete_model(model)

        if was_deleted and public_id:
            delete_image(public_id)

        return was_deleted


class OrderAdmin(ModelView):
    column_list = (
        "id",
        "customer_name",
        "customer_email",
        "status",
        "total_display",
        "created_at",
        "items_summary",
    )
    column_details_list = (
        "id",
        "user_id",
        "customer_name",
        "customer_email",
        "customer_phone",
        "status",
        "total_display",
        "created_at",
        "items_summary",
        "shipping_name",
        "shipping_address_line1",
        "shipping_address_line2",
        "shipping_city",
        "shipping_postal_code",
        "shipping_country",
        "rules_applied",
    )
    column_filters = ("status", "currency", "created_at")
    column_searchable_list = ("id", "customer_name", "customer_email")
    column_default_sort = ("created_at", True)
    can_create = False
    can_edit = False
    can_delete = False
    can_view_details = True
    column_labels = {
        "id": "ID",
        "user_id": "Usuario",
        "customer_name": "Cliente",
        "customer_email": "Email",
        "customer_phone": "Telefono",
        "total_display": "Total",
        "status": "Estado",
        "created_at": "Fecha",
        "items_summary": "Lineas del pedido",
        "shipping_name": "Destinatario",
        "shipping_address_line1": "Direccion",
        "shipping_address_line2": "Direccion 2",
        "shipping_city": "Ciudad",
        "shipping_postal_code": "Codigo postal",
        "shipping_country": "Pais",
        "rules_applied": "Reglas aplicadas",
    }
    column_formatters = {
        "total_display": lambda _v, _c, model, _p: _format_money(model.total, model.currency),
        "items_summary": lambda _v, _c, model, _p: _render_order_items_summary(model.items),
    }
    column_formatters_detail = column_formatters


class OrderItemAdmin(ModelView):
    column_list = (
        "id",
        "order_id",
        "product_name_snapshot",
        "dimensions",
        "quantity",
        "anchoring_display",
        "color_display",
        "options_display",
        "total",
    )
    column_details_list = (
        "id",
        "order_id",
        "product_name_snapshot",
        "dimensions",
        "quantity",
        "anchoring_display",
        "color_display",
        "options_display",
        "total",
        "rules_applied",
        "created_at",
    )
    can_create = False
    can_edit = False
    can_delete = False
    can_view_details = True
    column_labels = {
        "id": "ID",
        "order_id": "Pedido",
        "product_name_snapshot": "Producto",
        "dimensions": "Dimensiones",
        "quantity": "Cantidad",
        "anchoring_display": "Anclaje",
        "color_display": "Color",
        "options_display": "Opciones",
        "total": "Total",
        "rules_applied": "Reglas aplicadas",
        "created_at": "Fecha",
    }
    column_formatters = {
        "dimensions": lambda _v, _c, model, _p: OrderItemAdmin.format_dimensions(model),
        "anchoring_display": lambda _v, _c, model, _p: OrderItemAdmin.format_anchoring(model),
        "color_display": lambda _v, _c, model, _p: OrderItemAdmin.format_color(model),
        "options_display": lambda _v, _c, model, _p: OrderItemAdmin.format_options(model),
        "total": lambda _v, _c, model, _p: _format_money(
            model.total,
            model.order.currency if model.order else "EUR",
        ),
    }
    column_formatters_detail = column_formatters

    @staticmethod
    def format_dimensions(model):
        configuration = _get_order_item_configuration(model)
        return f"{configuration['width_cm']} x {configuration['height_cm']} cm"

    @staticmethod
    def format_anchoring(model):
        configuration = _get_order_item_configuration(model)
        return _format_anchoring_type(configuration["anchoring_type"])

    @staticmethod
    def format_color(model):
        configuration = _get_order_item_configuration(model)
        return _format_color(configuration["color"])

    @staticmethod
    def format_options(model):
        if not model.options_snapshot:
            return "-"

        return ", ".join(
            f"{opt.get('option', '-')} (+{opt.get('price', '0')} EUR)"
            for opt in model.options_snapshot
        )


class PaymentAdmin(ModelView):
    column_list = (
        "id",
        "order_id",
        "provider",
        "status",
        "amount",
        "currency",
        "reference",
        "external_id",
        "created_at",
    )
    column_filters = ("provider", "status", "created_at")
    column_searchable_list = ("reference", "external_id", "idempotency_key")
    column_default_sort = ("created_at", True)
    can_create = False
    can_edit = False
    can_delete = False
    can_view_details = True
    column_labels = {
        "id": "ID",
        "order_id": "Pedido",
        "provider": "Proveedor",
        "status": "Estado",
        "amount": "Importe",
        "currency": "Moneda",
        "reference": "Referencia",
        "external_id": "External ID",
        "created_at": "Fecha",
    }

    @action("mark_as_paid", "Marcar como pagado", "¿Marcar los pagos manuales seleccionados como pagados?")
    def action_mark_as_paid(self, ids):
        try:
            result = PaymentService.mark_manual_payments_succeeded(
                payment_ids=[int(payment_id) for payment_id in ids],
            )
        except Exception as exc:
            flash(f"No se pudieron actualizar los pagos: {exc}", "error")
            return

        if result["updated"]:
            flash(
                f"Se marcaron como pagados {result['updated']} pago(s) manual(es).",
                "success",
            )

        if result["skipped"]:
            flash(
                f"Se omitieron {result['skipped']} pago(s) no aptos para esta accion.",
                "warning",
            )


class CartAdmin(ModelView):
    column_list = ("id", "user_id", "anonymous_id", "items_count", "created_at")
    column_filters = ("created_at", "updated_at")
    column_searchable_list = ("id", "anonymous_id", "user_id")
    column_default_sort = ("created_at", True)
    can_create = False
    can_edit = False
    can_delete = False
    can_view_details = True
    column_labels = {
        "id": "ID",
        "user_id": "Usuario",
        "anonymous_id": "Session ID",
        "items_count": "Items",
        "created_at": "Fecha",
    }
    column_formatters = {
        "items_count": lambda _v, _c, model, _p: len(model.items),
    }


class CartItemAdmin(ModelView):
    column_list = (
        "id",
        "cart_id",
        "product_id",
        "width_cm",
        "height_cm",
        "quantity",
        "created_at",
    )
    column_filters = ("product_id", "created_at", "updated_at")
    column_searchable_list = ("id", "cart_id", "product_id")
    column_default_sort = ("created_at", True)
    can_create = False
    can_edit = False
    can_delete = False
    can_view_details = True
    column_labels = {
        "id": "ID",
        "cart_id": "Carrito",
        "product_id": "Producto",
        "width_cm": "Ancho (cm)",
        "height_cm": "Alto (cm)",
        "quantity": "Cantidad",
        "created_at": "Fecha",
    }
