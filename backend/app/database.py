"""Database connection, session factory and the declarative Base for all models."""
from datetime import datetime

from sqlalchemy import DateTime, create_engine, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from app.config import settings

# pool_pre_ping: check a connection is alive before using it.
# hide_parameters: database error messages (and so the server logs) never contain the
# values we sent, e.g. chat text or password hashes.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, hide_parameters=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Parent class of every table."""


class IdTimestampMixin:
    """Columns every table has: an integer primary key and a creation time."""

    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


def get_db():
    """FastAPI dependency: gives one DB session per request and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
