from flask_admin.contrib.sqla import ModelView
from app.extensions import db
from app.models.user import User


class UserAdmin(ModelView):
    column_list = ("id", "email", "is_active", "is_admin", "created_at")
    column_searchable_list = ("email",)
    column_filters = ("is_active", "is_admin")
    can_create = False
    can_edit = False
    can_delete = False
