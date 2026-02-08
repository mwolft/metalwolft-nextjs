from flask import Blueprint, jsonify, g
from app.utils.auth import login_required

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")


@profile_bp.get("")
@login_required
def get_profile():
    user = g.current_user

    return jsonify({
        "email": user.email,
        "is_admin": user.is_admin,
        "created_at": user.created_at.isoformat()
    })
