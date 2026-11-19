"""Counsellor availability slots and student appointments."""
import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, IdTimestampMixin
from app.models.user import User


class AppointmentStatus(str, enum.Enum):
    requested = "requested"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"


class AvailabilitySlot(IdTimestampMixin, Base):
    __tablename__ = "availability_slots"

    counsellor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # timezone=True stores the UTC offset, so times are unambiguous
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_booked: Mapped[bool] = mapped_column(Boolean, server_default="false")


class Appointment(IdTimestampMixin, Base):
    __tablename__ = "appointments"
    __table_args__ = (
        # A slot can have only ONE non-cancelled appointment. Cancelled ones don't count,
        # so a freed slot can be booked again while the cancelled row stays as history.
        Index(
            "uq_appointments_active_slot",
            "slot_id",
            unique=True,
            postgresql_where=text("status <> 'cancelled'"),
        ),
    )

    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    counsellor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    slot_id: Mapped[int] = mapped_column(ForeignKey("availability_slots.id", ondelete="CASCADE"))
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, name="appointment_status"), server_default="requested"
    )
    reason: Mapped[str] = mapped_column(Text)
    counsellor_notes: Mapped[str | None] = mapped_column(Text)  # private to counsellors, never sent to students

    # Python-side links (no schema change), used to show names and times
    student: Mapped[User] = relationship(foreign_keys=[student_id])
    counsellor: Mapped[User] = relationship(foreign_keys=[counsellor_id])
    slot: Mapped[AvailabilitySlot] = relationship()
