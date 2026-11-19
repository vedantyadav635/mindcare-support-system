"""Daily check-in questions (managed by admins) and students' answers to them."""
import enum

from sqlalchemy import JSON, Boolean, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, IdTimestampMixin
from app.models.chat import RiskLevel, risk_level_enum


class AnswerType(str, enum.Enum):
    option = "option"  # pick one of the listed options
    text = "text"  # short written answer


class CheckinMetric(str, enum.Enum):
    """Which wellbeing_entries score an option question fills (used by the trend charts)."""

    mood = "mood"
    stress = "stress"
    sleep = "sleep"
    none = "none"


class CheckinQuestion(IdTimestampMixin, Base):
    __tablename__ = "checkin_questions"

    text: Mapped[str] = mapped_column(String(300))
    answer_type: Mapped[AnswerType] = mapped_column(Enum(AnswerType, name="checkin_answer_type"))
    # Only for option questions: [{"label": "Good", "value": 4}, ...]
    options: Mapped[list | None] = mapped_column(JSON)
    metric: Mapped[CheckinMetric] = mapped_column(
        Enum(CheckinMetric, name="checkin_metric"), server_default="none"
    )
    is_required: Mapped[bool] = mapped_column(Boolean, server_default="true")
    max_length: Mapped[int | None] = mapped_column(Integer)  # only for text questions
    display_order: Mapped[int] = mapped_column(Integer)
    # "Deleting" a question sets this to false, so old answers still point at it
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")


class CheckinAnswer(IdTimestampMixin, Base):
    __tablename__ = "checkin_answers"
    # A check-in answers each question at most once
    __table_args__ = (UniqueConstraint("entry_id", "question_id", name="uq_checkin_answer_entry_question"),)

    entry_id: Mapped[int] = mapped_column(
        ForeignKey("wellbeing_entries.id", ondelete="CASCADE"), index=True
    )
    question_id: Mapped[int] = mapped_column(ForeignKey("checkin_questions.id"))
    # Option answers: the chosen value, plus its label copied in case the admin edits the options later
    option_value: Mapped[float | None] = mapped_column(Float)
    option_label: Mapped[str | None] = mapped_column(String(100))
    # Text answers: private, never logged
    text_answer: Mapped[str | None] = mapped_column(Text)
    risk_level: Mapped[RiskLevel] = mapped_column(risk_level_enum, server_default="none")

    question: Mapped[CheckinQuestion] = relationship()
