from functools import wraps
from flask import request, jsonify, g
import jwt

from app.config import Config
from app.models.user import User


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        print("DEBUG COOKIES:", request.cookies)
        token = request.cookies.get("access_token")

        if not token:
            return jsonify({"error": "Authentication required"}), 401

        try:
            payload = jwt.decode(
                token,
                Config.JWT_SECRET_KEY,
                algorithms=[Config.JWT_ALGORITHM]
            )
            user_id = payload.get("sub")

            if not user_id:
                raise jwt.InvalidTokenError

            user = User.query.get(user_id)

            if not user or not user.is_active:
                return jsonify({"error": "User not found"}), 401

            g.current_user = user

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.PyJWTError:
            return jsonify({"error": "Invalid access token"}), 401

        return f(*args, **kwargs)

    return decorated
