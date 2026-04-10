from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

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
                "origins": [
                    "https://literate-tribble-5gv75j7gv5q42vvgg-3000.app.github.dev",
                    "http://localhost:3000",
                    "http://127.0.0.1:3000"
                ]
            }
        }
    )
