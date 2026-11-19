"""Counsellor slots, counsellor list and appointment endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.appointment import (
    AppointmentOut,
    AppointmentUpdate,
    BookingIn,
    CounsellorAppointmentOut,
    CounsellorOut,
    SlotIn,
    SlotOut,
)
from app.services import appointment as service

router = APIRouter(prefix="/api", tags=["appointments"])

counsellor_only = require_role(UserRole.counsellor)
student_only = require_role(UserRole.student)
student_or_counsellor = require_role(UserRole.student, UserRole.counsellor)

# Students get AppointmentOut, counsellors get CounsellorAppointmentOut (with notes)
AnyAppointmentOut = CounsellorAppointmentOut | AppointmentOut


def _http(error: service.BookingError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=str(error))


# ---------- Slots ----------

@router.post("/slots", response_model=SlotOut, status_code=status.HTTP_201_CREATED)
def create_slot(data: SlotIn, db: Session = Depends(get_db), counsellor: User = Depends(counsellor_only)):
    try:
        return service.create_slot(db, counsellor, data)
    except service.BookingError as e:
        raise _http(e)


@router.get("/slots/mine", response_model=list[SlotOut])
def my_slots(db: Session = Depends(get_db), counsellor: User = Depends(counsellor_only)):
    return service.list_my_slots(db, counsellor)


@router.get("/slots/available", response_model=list[SlotOut])
def available_slots(
    counsellor_id: int | None = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    return service.list_available_slots(db, counsellor_id)


@router.delete("/slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(slot_id: int, db: Session = Depends(get_db), counsellor: User = Depends(counsellor_only)):
    try:
        service.delete_slot(db, counsellor, slot_id)
    except service.BookingError as e:
        raise _http(e)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Counsellors ----------

@router.get("/counsellors", response_model=list[CounsellorOut])
def list_counsellors(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return service.list_counsellors(db)


# ---------- Appointments ----------

@router.post("/appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def book(data: BookingIn, db: Session = Depends(get_db), student: User = Depends(student_only)):
    try:
        appointment = service.book_appointment(db, student, data)
    except service.BookingError as e:
        raise _http(e)
    return service.to_out(appointment, student)


@router.get("/appointments/mine", response_model=list[AnyAppointmentOut])
def my_appointments(db: Session = Depends(get_db), user: User = Depends(student_or_counsellor)):
    return service.list_my_appointments(db, user)


@router.patch("/appointments/{appointment_id}", response_model=AnyAppointmentOut)
def update_appointment(
    appointment_id: int,
    data: AppointmentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(student_or_counsellor),
):
    """Counsellor: change status / add notes. Student: only {"status": "cancelled"}."""
    try:
        return service.update_appointment(db, user, appointment_id, data)
    except service.BookingError as e:
        raise _http(e)
