from flask_admin.contrib.sqla import ModelView
from app.models.cart import Cart, CartItem
from app.extensions import db
from app.models.order import Order
from app.models.payment import Payment
from app.models.product import Product
from app.models.user import User


class UserAdmin(ModelView):
    column_list = ("id", "email", "is_active", "is_admin", "created_at")
    column_searchable_list = ("email",)
    column_filters = ("is_active", "is_admin")
    can_create = False
    can_edit = False
    can_delete = False


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
    form_columns = (
        "slug",
        "name",
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


class OrderAdmin(ModelView):
    column_list = ("id", "user_id", "total", "status", "created_at")
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
        "total": "Total",
        "status": "Estado",
        "created_at": "Fecha",
    }


class PaymentAdmin(ModelView):
    column_list = ("id", "order_id", "method", "status", "amount", "created_at")
    column_filters = ("method", "status", "provider", "created_at")
    column_searchable_list = ("order_id", "provider_reference")
    column_default_sort = ("created_at", True)
    can_create = False
    can_edit = False
    can_delete = False
    can_view_details = True
    column_labels = {
        "id": "ID",
        "order_id": "Pedido",
        "method": "Metodo",
        "status": "Estado",
        "amount": "Importe",
        "created_at": "Fecha",
    }


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
