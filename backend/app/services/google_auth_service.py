from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.config import Config
from app.models.user import User
from app.extensions import db
from app.services.auth_service import AuthService


class GoogleAuthService:
    @staticmethod
    def login_with_google(token: str):
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                Config.GOOGLE_CLIENT_ID,
            )
        except Exception:
            raise ValueError("Invalid Google token")

        email = idinfo.get("email")
        google_id = idinfo.get("sub")

        if not email or not google_id:
            raise ValueError("Invalid Google account data")

        user = User.query.filter_by(email=email).first()

        if not user:
            user = User(
                email=email,
                google_id=google_id,
                password_hash="GOOGLE_AUTH",
                is_active=True,
            )


            db.session.add(user)
            db.session.commit()

        access_token = AuthService.create_access_token(user.id)
        refresh_token = AuthService.create_refresh_token(user.id)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

