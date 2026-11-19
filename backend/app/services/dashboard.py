"""Builds the student and counsellor home-page data from the other services."""
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import AlertStatus, Appointment, AppointmentStatus, AvailabilitySlot, CrisisAlert, User, WellbeingEntry
from app.schemas.dashboard import CounsellorDashboard, StudentDashboard
from app.schemas.recommendation import RecommendationOut
from app.schemas.resource import ResourceOut
from app.services import recommender, wellbeing
from app.services.appointment import to_out

ACTIVE_STATUSES = (AppointmentStatus.requested, AppointmentStatus.confirmed)


def _appointments_query():
    """Appointments joined to their slot, with names and times loaded, earliest first."""
    return (
        select(Appointment)
        .join(Appointment.slot)
        .options(selectinload(Appointment.slot), selectinload(Appointment.student), selectinload(Appointment.counsellor))
        .order_by(AvailabilitySlot.start_time)
    )


def student_dashboard(db: Session, student: User) -> StudentDashboard:
    checkin_done = db.scalar(
        select(WellbeingEntry.id).where(WellbeingEntry.student_id == student.id, WellbeingEntry.entry_date == date.today())
    ) is not None

    next_appointment = db.scalar(
        _appointments_query()
        .where(
            Appointment.student_id == student.id,
            Appointment.status.in_(ACTIVE_STATUSES),
            AvailabilitySlot.start_time > datetime.now(timezone.utc),
        )
        .limit(1)
    )

    return StudentDashboard(
        checkin_done_today=checkin_done,
        trend=wellbeing.get_trends(db, student.id, "week")["points"],
        recommendations=[
            RecommendationOut(resource=ResourceOut.model_validate(rec.resource), score=rec.score, why=rec.why)
            for rec in recommender.recommend(db, student.id, limit=3)
        ],
        next_appointment=to_out(next_appointment, student) if next_appointment else None,
    )


def counsellor_dashboard(db: Session, counsellor: User) -> CounsellorDashboard:
    # "Today" in the server's local timezone, from midnight to midnight
    # ponytail: server timezone defines "today"; fine while the college is in one timezone
    day_start = datetime.combine(date.today(), time.min).astimezone()
    day_end = day_start + timedelta(days=1)
    mine = Appointment.counsellor_id == counsellor.id

    todays = db.scalars(
        _appointments_query().where(
            mine,
            Appointment.status != AppointmentStatus.cancelled,
            AvailabilitySlot.start_time >= day_start,
            AvailabilitySlot.start_time < day_end,
        )
    )
    pending = db.scalars(
        _appointments_query().where(
            mine,
            Appointment.status == AppointmentStatus.requested,
            AvailabilitySlot.start_time > datetime.now(timezone.utc),
        )
    )

    return CounsellorDashboard(
        # All counsellors share the alert queue (see GET /api/alerts)
        open_alerts=db.scalar(select(func.count()).select_from(CrisisAlert).where(CrisisAlert.status == AlertStatus.open)),
        todays_appointments=[to_out(a, counsellor) for a in todays],
        pending_requests=[to_out(a, counsellor) for a in pending],
    )
