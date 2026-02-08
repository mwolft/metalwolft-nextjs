from flask import Flask
from .config import Config
from .extensions import init_extensions
from app.routes.product_routes import products_bp   
from app.routes.auth_routes import auth_bp
from app.routes.profile_routes import profile_bp
from app.routes.cart_routes import cart_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_extensions(app)

    app.register_blueprint(products_bp)  
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(cart_bp)

    return app

