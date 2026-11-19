"""Self-help resources (breathing exercises, articles, videos, ...)."""
import enum

from sqlalchemy import Boolean, Enum, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, IdTimestampMixin


class ResourceType(str, enum.Enum):
    breathing = "breathing"
    sleep = "sleep"
    article = "article"
    video = "video"
    counselling = "counselling"
    activity = "activity"


class Resource(IdTimestampMixin, Base):
    __tablename__ = "resources"

    title: Mapped[str] = mapped_column(String(200))
    type: Mapped[ResourceType] = mapped_column(Enum(ResourceType, name="resource_type"))
    body: Mapped[str | None] = mapped_column(Text)
    url: Mapped[str | None] = mapped_column(String(500))
    # PostgreSQL text array, e.g. {"stress","exams"}; used to match resources to a student's mood
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), server_default="{}")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
