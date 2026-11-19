"""Request/response shapes for counsellor slots and appointments."""
from datetime import datetime

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator

from app.models import AppointmentStatus


# ---------- Slots ----------

class SlotIn(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [
        {"start_time": "2026-12-01T10:00:00+05:30", "end_time": "2026-12-01T10:45:00+05:30"}
    ]})

    # AwareDatetime rejects times without a timezone, e.g. "2026-12-01T10:00:00+05:30" is required
    start_time: AwareDatetime
    end_time: AwareDatetime

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class SlotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    counsellor_id: int
    start_time: datetime
    end_time: datetime
    is_booked: bool


class CounsellorOut(BaseModel):
    """Public counsellor info for students: no email or phone."""

    id: int
    full_name: str
    qualification: str | None
    specialization: str | None


# ---------- Appointments ----------

class BookingIn(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [{"slot_id": 1, "reason": "Feeling stressed about exams and not sleeping well"}]})

    slot_id: int
    reason: str = Field(min_length=1, max_length=1000)


class AppointmentUpdate(BaseModel):
    """status: the new status (optional, so a counsellor can update only the notes).
    counsellor_notes: counsellors only."""

    model_config = ConfigDict(json_schema_extra={"examples": [
        {"status": "confirmed"},
        {"status": "completed", "counsellor_notes": "Discussed exam anxiety; follow up in two weeks."},
        {"status": "cancelled"},
    ]})

    status: AppointmentStatus | None = None
    counsellor_notes: str | None = Field(default=None, max_length=5000)


class AppointmentOut(BaseModel):
    """What a student sees. Never includes counsellor_notes."""

    id: int
    status: AppointmentStatus
    reason: str
    start_time: datetime
    end_time: datetime
    student_id: int
    student_name: str
    counsellor_id: int
    counsellor_name: str


class CounsellorAppointmentOut(AppointmentOut):
    """What a counsellor sees: the same plus their private notes."""

    counsellor_notes: str | None
