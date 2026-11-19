"""One-call dashboard responses, so each frontend home page needs a single request."""
import datetime as dt

from pydantic import BaseModel

from app.schemas.appointment import AppointmentOut, CounsellorAppointmentOut
from app.schemas.recommendation import RecommendationOut


class TrendPoint(BaseModel):
    date: dt.date
    mood: int | None
    stress: int | None
    sleep_hours: float | None


class StudentDashboard(BaseModel):
    checkin_done_today: bool
    trend: list[TrendPoint]  # last 7 days, one point per day (null = no check-in)
    recommendations: list[RecommendationOut]  # top 3
    next_appointment: AppointmentOut | None  # earliest upcoming requested/confirmed one


class CounsellorDashboard(BaseModel):
    open_alerts: int
    todays_appointments: list[CounsellorAppointmentOut]
    pending_requests: list[CounsellorAppointmentOut]  # upcoming, still "requested"
