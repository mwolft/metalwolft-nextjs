from flask import Flask
from .config import Config
from .extensions import init_extensions
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_admin import Admin
from app.routes.product_routes import products_bp   
from app.routes.auth_routes import auth_bp
from app.routes.profile_routes import profile_bp
from app.routes.cart_routes import cart_bp
from app.routes.google_auth_routes import google_auth_bp
from app.routes.pricing_routes import pricing_bp
from app.routes.checkout_routes import checkout_bp
from app.routes.payment_routes import orders_bp, payments_bp, webhooks_bp

from app.admin import (
    CartAdmin,
    CartItemAdmin,
    OrderAdmin,
    PaymentAdmin,
    ProductAdmin,
    UserAdmin,
    OrderItemAdmin,
)
from app.models.cart import Cart, CartItem
from app.models.order import Order
from app.models.payment import Payment
from app.models.product import Product
from app.models.user import User
from app.models.order import OrderItem
from app.extensions import db

def create_app():
    app = Flask(__name__, static_url_path="")

    from flask_cors import CORS
    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/api/*": {
                "origins": [
                    "https://literate-tribble-5gv75j7gv5q42vvgg-3000.app.github.dev",
                    "http://localhost:3000",
                    "http://127.0.0.1:3000"
                ]
            }
        }
    )

    app.wsgi_app = ProxyFix(
        app.wsgi_app,
        x_for=1,
        x_proto=1,
        x_host=1,
        x_port=1
    )


    app.config.from_object(Config)

    init_extensions(app)

    admin = Admin(app, name="MetalWolft Admin", url="/admin")

    admin.add_view(UserAdmin(User, db.session))
    admin.add_view(ProductAdmin(Product, db.session))
    admin.add_view(OrderAdmin(Order, db.session))
    admin.add_view(PaymentAdmin(Payment, db.session))
    admin.add_view(CartAdmin(Cart, db.session))
    admin.add_view(CartItemAdmin(CartItem, db.session))
    admin.add_view(OrderItemAdmin(OrderItem, db.session))

    app.register_blueprint(products_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(google_auth_bp)
    app.register_blueprint(pricing_bp)
    app.register_blueprint(checkout_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(webhooks_bp)
    


    return app


