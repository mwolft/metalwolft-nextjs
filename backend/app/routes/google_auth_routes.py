from flask import Blueprint, jsonify, make_response, request
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
    access_token = auth_data["access_token"]
    refresh_token = auth_data["refresh_token"]

    response = make_response(
        jsonify({"message": "Google login successful"})
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

    return response, 200


