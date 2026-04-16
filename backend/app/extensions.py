from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from app.config import Config

db = SQLAlchemy()
migrate = Migrate()

def init_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db)

    CORS(
        app,
        supports_credentials=True,
        resources={
            r"/api/*": {
                "origins": Config.CORS_ALLOWED_ORIGINS
            }
        }
    )
