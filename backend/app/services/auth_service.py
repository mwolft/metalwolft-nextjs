from datetime import datetime, timedelta, timezone
import jwt

from werkzeug.security import generate_password_hash, check_password_hash
from app.config import Config


class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return generate_password_hash(password)

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        return check_password_hash(password_hash, password)

    @staticmethod
    def _generate_token(payload: dict, expires_delta: timedelta) -> str:
        now = datetime.now(timezone.utc)

        payload = payload.copy()
        payload["iat"] = int(now.timestamp())
        payload["exp"] = int((now + expires_delta).timestamp())

        return jwt.encode(
            payload,
            Config.JWT_SECRET_KEY,
            algorithm=Config.JWT_ALGORITHM
        )

    @staticmethod
    def create_access_token(user_id: int) -> str:
        return AuthService._generate_token(
            payload={"sub": str(user_id), "type": "access"},
            expires_delta=timedelta(minutes=15)
        )

    @staticmethod
    def create_refresh_token(user_id: int) -> str:
        return AuthService._generate_token(
            payload={"sub": user_id, "type": "refresh"},
            expires_delta=timedelta(days=7)
        )
