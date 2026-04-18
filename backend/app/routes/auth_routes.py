from datetime import datetime, timezone

import jwt
from flask import Blueprint, jsonify, make_response, request
from sqlalchemy.exc import IntegrityError

from app.config import Config
from app.extensions import db
from app.models.user import User
from app.services.auth_service import AuthService
from app.services.email_service import EmailService

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    try:
        AuthService.validate_password_strength(password)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    user = User(
        email=email,
        password_hash=AuthService.hash_password(password),
    )

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email already registered"}), 409

    access_token = AuthService.create_access_token(user.id)
    refresh_token = AuthService.create_refresh_token(user.id)

    response = make_response(jsonify({"message": "User registered"}))
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        path="/",
    )

    return response, 201


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    user = User.query.filter_by(email=email, is_active=True).first()

    if not user or not AuthService.verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = AuthService.create_access_token(user.id)
    refresh_token = AuthService.create_refresh_token(user.id)

    response = make_response(jsonify({"message": "Login successful"}))
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        path="/",
    )

    return response


@auth_bp.post("/password-reset/request")
def request_password_reset():
    if not EmailService.is_configured():
        return jsonify({"error": "Password reset email is not configured"}), 503

    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        return jsonify({"error": "Missing email"}), 400

    user = User.query.filter_by(email=email, is_active=True).first()

    if user:
        token = AuthService.generate_password_reset_token()
        user.password_reset_token_hash = AuthService.hash_password_reset_token(token)
        user.password_reset_expires_at = AuthService.get_password_reset_expiry()
        reset_url = (
            f"{Config.FRONTEND_BASE_URL.rstrip('/')}/reset-password?token={token}"
        )

        try:
            EmailService.send_password_reset_email(
                to_email=user.email,
                reset_url=reset_url,
            )
            db.session.commit()
        except Exception:
            db.session.rollback()
            return jsonify({"error": "Could not send password reset email"}), 502

    return jsonify(
        {
            "message": "Si existe una cuenta con ese email, enviaremos un enlace para restablecer la contrasena."
        }
    )


@auth_bp.post("/password-reset/confirm")
def confirm_password_reset():
    data = request.get_json() or {}
    token = data.get("token")
    password = data.get("password")

    if not token or not password:
        return jsonify({"error": "Missing token or password"}), 400

    try:
        AuthService.validate_password_strength(password)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    token_hash = AuthService.hash_password_reset_token(token)
    user = User.query.filter_by(
        password_reset_token_hash=token_hash,
        is_active=True,
    ).first()

    if not user or not user.password_reset_expires_at:
        return jsonify({"error": "Invalid or expired reset token"}), 400

    expires_at = user.password_reset_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        user.password_reset_token_hash = None
        user.password_reset_expires_at = None
        db.session.commit()
        return jsonify({"error": "Invalid or expired reset token"}), 400

    user.password_hash = AuthService.hash_password(password)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
    db.session.commit()

    return jsonify({"message": "Password updated successfully"})


@auth_bp.post("/refresh")
def refresh():
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        return jsonify({"error": "Missing refresh token"}), 401

    try:
        payload = jwt.decode(
            refresh_token,
            Config.JWT_SECRET_KEY,
            algorithms=["HS256"],
        )

        if payload.get("type") != "refresh":
            raise jwt.InvalidTokenError

        user_id = payload.get("sub")

    except jwt.PyJWTError:
        return jsonify({"error": "Invalid refresh token"}), 401

    access_token = AuthService.create_access_token(user_id)

    response = make_response(jsonify({"message": "Token refreshed"}))
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
    )

    return response


@auth_bp.post("/logout")
def logout():
    response = make_response(jsonify({"message": "Logged out"}))
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response
