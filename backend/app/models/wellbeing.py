"""One row per student per day = one daily check-in.

The answers live in checkin_answers. mood, stress and sleep_hours are copied here from the
answers to the mood/stress/sleep questions, so the trend charts only need this table.
"""
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, Float, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, IdTimestampMixin

if TYPE_CHECKING:  # only for type hints; avoids a circular import at runtime
    from app.models.checkin import CheckinAnswer


class WellbeingEntry(IdTimestampMixin, Base):
    __tablename__ = "wellbeing_entries"
    __table_args__ = (
        # A student can log only one entry per day
        UniqueConstraint("student_id", "entry_date", name="uq_wellbeing_student_date"),
        # The database itself rejects out-of-range values (NULL is allowed)
        CheckConstraint("mood BETWEEN 1 AND 5", name="ck_wellbeing_mood_range"),
        CheckConstraint("stress BETWEEN 1 AND 5", name="ck_wellbeing_stress_range"),
        CheckConstraint("sleep_hours BETWEEN 0 AND 24", name="ck_wellbeing_sleep_range"),
    )

    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    entry_date: Mapped[date] = mapped_column(Date)
    # Null when that question was not answered (or no active question has that metric)
    mood: Mapped[int | None] = mapped_column(Integer)  # 1 (very low) .. 5 (very good)
    stress: Mapped[int | None] = mapped_column(Integer)  # 1 (none) .. 5 (very high)
    sleep_hours: Mapped[float | None] = mapped_column(Float)
    note: Mapped[str | None] = mapped_column(Text)  # unused since the question-based check-in; kept for old data

    # Deleting an entry deletes its answers (ON DELETE CASCADE in the database too)
    answers: Mapped[list["CheckinAnswer"]] = relationship(
        cascade="all, delete-orphan", passive_deletes=True
    )
