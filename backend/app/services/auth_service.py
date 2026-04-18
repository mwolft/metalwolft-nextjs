from datetime import datetime, timedelta, timezone
import hashlib
import re
import secrets

import jwt
from werkzeug.security import check_password_hash, generate_password_hash

from app.config import Config


class AuthService:
    PASSWORD_MIN_LENGTH = 8

    @staticmethod
    def hash_password(password: str) -> str:
        return generate_password_hash(password)

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        if not password_hash:
            return False
        return check_password_hash(password_hash, password)

    @staticmethod
    def get_password_policy_error(password: str) -> str | None:
        if len(password) < AuthService.PASSWORD_MIN_LENGTH:
            return (
                f"La contraseña debe tener al menos {AuthService.PASSWORD_MIN_LENGTH} caracteres, "
                "una mayúscula y un número."
            )

        if not re.search(r"[A-Z]", password):
            return "La contraseña debe incluir al menos una letra mayúscula."

        if not re.search(r"\d", password):
            return "La contraseña debe incluir al menos un número."

        return None

    @staticmethod
    def validate_password_strength(password: str):
        error = AuthService.get_password_policy_error(password)
        if error:
            raise ValueError(error)

    @staticmethod
    def generate_password_reset_token() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_password_reset_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def get_password_reset_expiry():
        return datetime.now(timezone.utc) + timedelta(
            minutes=Config.PASSWORD_RESET_TOKEN_TTL_MINUTES
        )

    @staticmethod
    def _generate_token(payload: dict, expires_delta: timedelta) -> str:
        now = datetime.now(timezone.utc)

        payload = payload.copy()
        payload["iat"] = int(now.timestamp())
        payload["exp"] = int((now + expires_delta).timestamp())

        return jwt.encode(
            payload,
            Config.JWT_SECRET_KEY,
            algorithm=Config.JWT_ALGORITHM,
        )

    @staticmethod
    def create_access_token(user_id: int) -> str:
        return AuthService._generate_token(
            payload={"sub": str(user_id), "type": "access"},
            expires_delta=timedelta(minutes=15),
        )

    @staticmethod
    def create_refresh_token(user_id: int) -> str:
        return AuthService._generate_token(
            payload={"sub": user_id, "type": "refresh"},
            expires_delta=timedelta(days=7),
        )
