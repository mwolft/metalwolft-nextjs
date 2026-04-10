from functools import wraps
from flask import request, jsonify, g
import jwt

from app.config import Config
from app.models.user import User


def get_current_user_from_request():
    token = request.cookies.get("access_token")

    if not token:
        return None

    try:
        payload = jwt.decode(
            token,
            Config.JWT_SECRET_KEY,
            algorithms=[Config.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")

        if not user_id or payload.get("type") != "access":
            return None

        user = User.query.get(user_id)

        if not user or not user.is_active:
            return None

        return user
    except jwt.PyJWTError:
        return None


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user_from_request()

        if not user:
            return jsonify({"error": "Authentication required"}), 401

        g.current_user = user

        return f(*args, **kwargs)

    return decorated
