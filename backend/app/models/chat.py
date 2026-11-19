"""Chatbot messages and the crisis alerts raised from them."""
import enum

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, IdTimestampMixin
from app.models.user import User


class ChatSender(str, enum.Enum):
    student = "student"
    bot = "bot"


class RiskLevel(str, enum.Enum):
    none = "none"
    high = "high"


# One PostgreSQL enum type shared by chat_messages and checkin_answers
risk_level_enum = Enum(RiskLevel, name="risk_level")


class AlertSource(str, enum.Enum):
    chat = "chat"
    assessment = "assessment"
    checkin = "checkin"


class AlertStatus(str, enum.Enum):
    open = "open"
    seen = "seen"
    closed = "closed"


class ChatMessage(IdTimestampMixin, Base):
    __tablename__ = "chat_messages"

    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    sender: Mapped[ChatSender] = mapped_column(Enum(ChatSender, name="chat_sender"))
    text: Mapped[str] = mapped_column(Text)  # never write this to logs
    sentiment: Mapped[str | None] = mapped_column(String(20))
    emotion: Mapped[str | None] = mapped_column(String(30))
    risk_level: Mapped[RiskLevel] = mapped_column(risk_level_enum, server_default="none")


class CrisisAlert(IdTimestampMixin, Base):
    __tablename__ = "crisis_alerts"

    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # Set when the alert came from a chat message; null for assessment alerts
    message_id: Mapped[int | None] = mapped_column(
        ForeignKey("chat_messages.id", ondelete="SET NULL")
    )
    source: Mapped[AlertSource] = mapped_column(Enum(AlertSource, name="alert_source"))
    matched_rule: Mapped[str] = mapped_column(String(100))  # which rule fired, e.g. "want_to_die"
    # Short excerpt shown to counsellors (never the full text). Stored here so it survives
    # even if the source (e.g. a re-submitted check-in answer) is replaced later.
    excerpt: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, name="alert_status"), server_default="open"
    )
    # Counsellor/admin who handled the alert
    handled_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    student: Mapped[User] = relationship(foreign_keys=[student_id])  # Python-side link, no schema change
