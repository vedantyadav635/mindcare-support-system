"""Counsellor availability slots and appointment booking."""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Appointment,
    AppointmentStatus,
    AvailabilitySlot,
    CounsellorProfile,
    User,
    UserRole,
)
from app.schemas.appointment import (
    AppointmentOut,
    AppointmentUpdate,
    BookingIn,
    CounsellorAppointmentOut,
    CounsellorOut,
    SlotIn,
)


# Each error carries the HTTP status the router should send
class BookingError(Exception):
    status_code = 400


class NotFound(BookingError):
    status_code = 404


class Forbidden(BookingError):
    status_code = 403


class Conflict(BookingError):
    status_code = 409


class Invalid(BookingError):
    status_code = 422


# Which status changes are allowed: current status -> possible next statuses
ALLOWED_MOVES = {
    AppointmentStatus.requested: {AppointmentStatus.confirmed, AppointmentStatus.cancelled},
    AppointmentStatus.confirmed: {AppointmentStatus.completed, AppointmentStatus.cancelled},
    # completed and cancelled are final
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------- Slots (counsellor) ----------

def create_slot(db: Session, counsellor: User, data: SlotIn) -> AvailabilitySlot:
    if data.start_time <= _now():
        raise Invalid("start_time must be in the future")

    # Two time ranges overlap when each one starts before the other ends
    # ponytail: check-then-insert; two simultaneous requests could both pass. An exclusion constraint would close that gap.
    overlapping = db.scalar(
        select(AvailabilitySlot.id).where(
            AvailabilitySlot.counsellor_id == counsellor.id,
            AvailabilitySlot.start_time < data.end_time,
            AvailabilitySlot.end_time > data.start_time,
        )
    )
    if overlapping is not None:
        raise Conflict("This slot overlaps one of your existing slots")

    slot = AvailabilitySlot(counsellor_id=counsellor.id, start_time=data.start_time, end_time=data.end_time)
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


def list_my_slots(db: Session, counsellor: User) -> list[AvailabilitySlot]:
    return list(
        db.scalars(
            select(AvailabilitySlot)
            .where(AvailabilitySlot.counsellor_id == counsellor.id)
            .order_by(AvailabilitySlot.start_time)
        )
    )


def delete_slot(db: Session, counsellor: User, slot_id: int) -> None:
    slot = db.get(AvailabilitySlot, slot_id)
    if slot is None or slot.counsellor_id != counsellor.id:
        raise NotFound("Slot not found")  # same answer for "not yours", so IDs can't be probed
    if slot.is_booked:
        raise Conflict("A booked slot cannot be deleted; cancel the appointment first")
    db.delete(slot)
    db.commit()


# ---------- For students ----------

def list_counsellors(db: Session) -> list[CounsellorOut]:
    rows = db.execute(
        select(User, CounsellorProfile)
        .outerjoin(CounsellorProfile, CounsellorProfile.user_id == User.id)
        .where(User.role == UserRole.counsellor, User.is_active)
        .order_by(User.full_name)
    ).all()
    return [
        CounsellorOut(
            id=user.id,
            full_name=user.full_name,
            qualification=profile.qualification if profile else None,
            specialization=profile.specialization if profile else None,
        )
        for user, profile in rows
    ]


def list_available_slots(db: Session, counsellor_id: int | None) -> list[AvailabilitySlot]:
    query = (
        select(AvailabilitySlot)
        .join(User, User.id == AvailabilitySlot.counsellor_id)
        .where(~AvailabilitySlot.is_booked, AvailabilitySlot.start_time > _now(), User.is_active)
        .order_by(AvailabilitySlot.start_time)
    )
    if counsellor_id is not None:
        query = query.where(AvailabilitySlot.counsellor_id == counsellor_id)
    return list(db.scalars(query))


def book_appointment(db: Session, student: User, data: BookingIn) -> Appointment:
    """Book a slot. Safe when two students click "book" at the same moment:

    SELECT ... FOR UPDATE locks the slot row until this transaction commits. The second
    student's request waits at this line, then sees is_booked = true and gets a 409.
    """
    slot = db.scalar(
        select(AvailabilitySlot).where(AvailabilitySlot.id == data.slot_id).with_for_update()
    )
    if slot is None:
        raise NotFound("Slot not found")
    if slot.is_booked:
        raise Conflict("This slot is already booked")
    if slot.start_time <= _now():
        raise Invalid("This slot has already started")

    # Both changes are saved in ONE transaction: either both happen or neither does
    slot.is_booked = True
    appointment = Appointment(
        student_id=student.id, counsellor_id=slot.counsellor_id, slot_id=slot.id, reason=data.reason
    )
    db.add(appointment)
    db.commit()  # also releases the lock
    return appointment


# ---------- Appointments (both roles) ----------

def to_out(appointment: Appointment, viewer: User) -> AppointmentOut:
    """Students get AppointmentOut (no notes); counsellors get CounsellorAppointmentOut."""
    fields = dict(
        id=appointment.id,
        status=appointment.status,
        reason=appointment.reason,
        start_time=appointment.slot.start_time,
        end_time=appointment.slot.end_time,
        student_id=appointment.student_id,
        student_name=appointment.student.full_name,
        counsellor_id=appointment.counsellor_id,
        counsellor_name=appointment.counsellor.full_name,
    )
    if viewer.role == UserRole.counsellor:
        return CounsellorAppointmentOut(**fields, counsellor_notes=appointment.counsellor_notes)
    return AppointmentOut(**fields)


def list_my_appointments(db: Session, user: User) -> list[AppointmentOut]:
    owner_column = Appointment.student_id if user.role == UserRole.student else Appointment.counsellor_id
    appointments = db.scalars(
        select(Appointment)
        .join(Appointment.slot)
        .where(owner_column == user.id)
        .options(
            selectinload(Appointment.slot),
            selectinload(Appointment.student),
            selectinload(Appointment.counsellor),
        )
        .order_by(AvailabilitySlot.start_time)
    )
    return [to_out(a, user) for a in appointments]


def update_appointment(db: Session, user: User, appointment_id: int, data: AppointmentUpdate) -> AppointmentOut:
    # Lock the row so two simultaneous updates can't both apply a status change
    appointment = db.scalar(select(Appointment).where(Appointment.id == appointment_id).with_for_update())
    if appointment is None:
        raise NotFound("Appointment not found")
    is_student = user.role == UserRole.student
    owner_id = appointment.student_id if is_student else appointment.counsellor_id
    if owner_id != user.id:
        raise NotFound("Appointment not found")  # same answer for "not yours", so IDs can't be probed

    if is_student:
        # A student may only cancel their own appointment, and can never write notes
        if data.counsellor_notes is not None:
            raise Forbidden("Only the counsellor can add notes")
        if data.status != AppointmentStatus.cancelled:
            raise Forbidden("Students can only cancel an appointment")

    if data.status is not None:
        if data.status not in ALLOWED_MOVES.get(appointment.status, set()):
            raise Conflict(f"Cannot change an appointment from {appointment.status.value} to {data.status.value}")
        appointment.status = data.status
        if data.status == AppointmentStatus.cancelled:
            appointment.slot.is_booked = False  # the slot can be booked again

    if data.counsellor_notes is not None:
        appointment.counsellor_notes = data.counsellor_notes

    db.commit()
    return to_out(appointment, user)
