"""Counsellor availability slots and student appointments."""
import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, IdTimestampMixin


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

    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    counsellor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # unique=True -> a slot can be booked by only one appointment
    slot_id: Mapped[int] = mapped_column(
        ForeignKey("availability_slots.id", ondelete="CASCADE"), unique=True
    )
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus, name="appointment_status"), server_default="requested"
    )
    reason: Mapped[str] = mapped_column(Text)
    counsellor_notes: Mapped[str | None] = mapped_column(Text)
