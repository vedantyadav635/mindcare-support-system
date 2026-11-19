"""Shapes for the crisis response (shown to students) and crisis alerts (shown to counsellors)."""
from datetime import datetime

from pydantic import BaseModel

from app.models import AlertSource, AlertStatus


class Helpline(BaseModel):
    name: str
    contact: str


class CrisisResponseOut(BaseModel):
    message: str
    helplines: list[Helpline]
    campus_counsellor: str
    show_urgent_booking: bool  # frontend shows a "Book an urgent session" button


class AlertOut(BaseModel):
    id: int
    student_id: int
    student_name: str
    source: AlertSource
    matched_rule: str
    reason: str  # human-readable description of the rule
    excerpt: str | None  # short excerpt only, never the full text
    status: AlertStatus
    handled_by: int | None
    created_at: datetime


class AlertUpdate(BaseModel):
    status: AlertStatus
