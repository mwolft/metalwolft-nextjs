# backend/app/app.py

from flask import Flask
from .config import Config
from .extensions import init_extensions
from app.routes.products import products_bp   

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_extensions(app)

    app.register_blueprint(products_bp)  

    return app

