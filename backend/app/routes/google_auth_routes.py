from flask import Blueprint, request
from app.services.google_auth_service import GoogleAuthService

google_auth_bp = Blueprint(
    "google_auth",
    __name__,
    url_prefix="/api/auth"
)

@google_auth_bp.route("/google", methods=["POST"])
def google_login():
    data = request.get_json()
    token = data.get("token")

    if not token:
        return {"error": "Missing Google token"}, 400

    auth_data = GoogleAuthService.login_with_google(token)

    return auth_data, 200


