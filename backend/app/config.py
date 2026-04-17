import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(
        BASE_DIR, "..", "metalwolft.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = "metalwolft_super_secret_jwt_key_2026_secure"
    JWT_ALGORITHM = "HS256"

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

    DEFAULT_CURRENCY = "EUR"

    DEFAULT_MIN_WIDTH_CM = 40
    DEFAULT_MAX_WIDTH_CM = 240
    DEFAULT_MIN_HEIGHT_CM = 40
    DEFAULT_MAX_HEIGHT_CM = 240

    FREE_SHIPPING_THRESHOLD = 150
    BASE_SHIPPING_FEE = 17

    OVERSIZE_SIDE_THRESHOLD_CM = 175
    OVERSIZE_SUM_THRESHOLD_CM = 300
    OVERSIZE_SUM_MAX_THRESHOLD_CM = 400

    OVERSIZE_SIDE_SURCHARGE = 49
    OVERSIZE_SUM_SURCHARGE = 49
    OVERSIZE_SUM_MAX_SURCHARGE = 99

    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
    STRIPE_SUCCESS_URL = os.getenv(
        "STRIPE_SUCCESS_URL",
        "https://animated-tribble-v6pjw9j6pp4rhwwrg-3000.app.github.dev/checkout/success",
    )
    STRIPE_CANCEL_URL = os.getenv(
        "STRIPE_CANCEL_URL",
        "https://animated-tribble-v6pjw9j6pp4rhwwrg-3000.app.github.dev/checkout/cancel",
    )
    PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
    PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
    PAYPAL_BASE_URL = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")
    PAYPAL_SUCCESS_URL = os.getenv(
        "PAYPAL_SUCCESS_URL",
        "https://animated-tribble-v6pjw9j6pp4rhwwrg-3000.app.github.dev/checkout/paypal/success",
    )
    PAYPAL_CANCEL_URL = os.getenv(
        "PAYPAL_CANCEL_URL",
        "https://animated-tribble-v6pjw9j6pp4rhwwrg-3000.app.github.dev/checkout/paypal/cancel",
    )

    CORS_ALLOWED_ORIGINS = [
        r"https://.*-3000\.app\.github\.dev",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
