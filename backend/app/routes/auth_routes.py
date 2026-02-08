from flask import Blueprint, request, jsonify, make_response
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.user import User
from app.services.auth_service import AuthService

import jwt
from app.config import Config

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    user = User(
        email=email,
        password_hash=AuthService.hash_password(password)
    )

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email already registered"}), 409

    access_token = AuthService.create_access_token(user.id)
    refresh_token = AuthService.create_refresh_token(user.id)

    response = make_response(
        jsonify({"message": "User registered"})
    )

    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        samesite="None",
        path="/"
    )


    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        path="/"
    )

    return response, 201


@auth_bp.post("/login")
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing credentials"}), 400

    user = User.query.filter_by(email=email, is_active=True).first()

    if not user or not AuthService.verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = AuthService.create_access_token(user.id)
    refresh_token = AuthService.create_refresh_token(user.id)

    response = make_response(
        jsonify({"message": "Login successful"})
    )

    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        samesite="None",
        path="/"
    )

    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=False,
        samesite="Lax",
        path="/"
    )

    return response


@auth_bp.post("/refresh")
def refresh():
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        return jsonify({"error": "Missing refresh token"}), 401

    try:
        payload = jwt.decode(
            refresh_token,
            Config.JWT_SECRET_KEY,
            algorithms=["HS256"]
        )

        if payload.get("type") != "refresh":
            raise jwt.InvalidTokenError

        user_id = payload.get("sub")

    except jwt.PyJWTError:
        return jsonify({"error": "Invalid refresh token"}), 401

    access_token = AuthService.create_access_token(user_id)

    response = make_response(
        jsonify({"message": "Token refreshed"})
    )

    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=True,
        samesite="None",
        path="/"
    )



    return response


@auth_bp.post("/logout")
def logout():
    response = make_response(
        jsonify({"message": "Logged out"})
    )

    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return response
