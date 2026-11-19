"""What happens after a crisis is detected: alert counsellors, and show the student help right away.

Used by every source: daily check-in, PHQ-9 assessment, and (later) the chatbot.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.models import AlertSource, AlertStatus, CrisisAlert, User
from app.schemas.safety import AlertOut, CrisisResponseOut, Helpline
from app.services.safety import describe_rule

EXCERPT_LENGTH = 120


class AlertNotFound(Exception):
    pass


def make_excerpt(text: str, limit: int = EXCERPT_LENGTH) -> str:
    """First `limit` characters, cut at a word boundary, so counsellors see context but not everything."""
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0] + "…"


def create_crisis_alert(
    db: Session,
    student_id: int,
    source: AlertSource,
    matched_rule: str,
    message_id: int | None = None,
    excerpt: str | None = None,
) -> CrisisAlert:
    """Add an OPEN alert to the session. The caller commits it together with the data that
    triggered it, so we never save one without the other."""
    alert = CrisisAlert(
        student_id=student_id,
        source=source,
        matched_rule=matched_rule,
        message_id=message_id,
        excerpt=make_excerpt(excerpt) if excerpt else None,
    )
    db.add(alert)
    return alert


def crisis_response() -> CrisisResponseOut:
    """Fixed, warm message shown to a student whose text or answers suggest they may be in danger."""
    return CrisisResponseOut(
        message=(
            "Thank you for sharing this with us. It sounds like you are going through something really painful, "
            "and you don't have to face it alone. Please reach out to someone right now: a helpline, "
            "a counsellor, or a person you trust. If you are in immediate danger, call 112."
        ),
        helplines=[
            Helpline(name="Tele-MANAS (free, 24x7, Govt. of India)", contact="14416 or 1-800-891-4416"),
            Helpline(name="Emergency", contact="112"),
        ],
        campus_counsellor=settings.CAMPUS_COUNSELLOR_CONTACT,
        show_urgent_booking=True,
    )


# ---------- Counsellor alert list ----------

def _alert_out(alert: CrisisAlert) -> AlertOut:
    return AlertOut(
        id=alert.id,
        student_id=alert.student_id,
        student_name=alert.student.full_name,
        source=alert.source,
        matched_rule=alert.matched_rule,
        reason=describe_rule(alert.matched_rule),
        excerpt=alert.excerpt,
        status=alert.status,
        handled_by=alert.handled_by,
        created_at=alert.created_at,
    )


def list_alerts(db: Session, status: AlertStatus | None) -> list[AlertOut]:
    query = (
        select(CrisisAlert)
        .options(selectinload(CrisisAlert.student))
        .order_by(CrisisAlert.created_at.desc(), CrisisAlert.id.desc())  # newest first
    )
    if status is not None:
        query = query.where(CrisisAlert.status == status)
    return [_alert_out(alert) for alert in db.scalars(query)]


def update_alert_status(db: Session, counsellor: User, alert_id: int, status: AlertStatus) -> AlertOut:
    alert = db.get(CrisisAlert, alert_id)
    if alert is None:
        raise AlertNotFound()
    alert.status = status
    alert.handled_by = counsellor.id  # who last acted on it
    db.commit()
    return _alert_out(alert)
