"""Daily wellbeing check-ins (mood, stress, sleep)."""
from datetime import date

from sqlalchemy import CheckConstraint, Date, Float, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, IdTimestampMixin


class WellbeingEntry(IdTimestampMixin, Base):
    __tablename__ = "wellbeing_entries"
    __table_args__ = (
        # A student can log only one entry per day
        UniqueConstraint("student_id", "entry_date", name="uq_wellbeing_student_date"),
        # The database itself rejects out-of-range values
        CheckConstraint("mood BETWEEN 1 AND 5", name="ck_wellbeing_mood_range"),
        CheckConstraint("stress BETWEEN 1 AND 5", name="ck_wellbeing_stress_range"),
        CheckConstraint("sleep_hours BETWEEN 0 AND 24", name="ck_wellbeing_sleep_range"),
    )

    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    entry_date: Mapped[date] = mapped_column(Date)
    mood: Mapped[int] = mapped_column(Integer)  # 1 (very low) .. 5 (very good)
    stress: Mapped[int] = mapped_column(Integer)  # 1 (none) .. 5 (very high)
    sleep_hours: Mapped[float] = mapped_column(Float)
    note: Mapped[str | None] = mapped_column(Text)
