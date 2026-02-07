from sqlalchemy import engine_from_config, pool
from alembic import context
from app.config import Config
from app.extensions import db
from app.models import product  # importa modelos

config = context.config

target_metadata = db.metadata


def run_migrations_offline():
    context.configure(
        url=Config.SQLALCHEMY_DATABASE_URI,
        target_metadata=target_metadata,
        literal_binds=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        {
            "sqlalchemy.url": Config.SQLALCHEMY_DATABASE_URI
        },
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
