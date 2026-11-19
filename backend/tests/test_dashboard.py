from datetime import date, datetime, time, timedelta, timezone

import pytest

from app.models import AlertSource, Appointment, AppointmentStatus, AvailabilitySlot, UserRole, WellbeingEntry
from app.services.escalation import create_crisis_alert
from app.services.resource import seed_default_resources


def add_appointment(db, student, counsellor, start, status=AppointmentStatus.requested):
    """Insert directly (the API refuses past slots, but 'today' may already be partly over)."""
    slot = AvailabilitySlot(counsellor_id=counsellor.id, start_time=start, end_time=start + timedelta(hours=1), is_booked=True)
    db.add(slot)
    db.flush()
    appointment = Appointment(student_id=student.id, counsellor_id=counsellor.id, slot_id=slot.id, reason="talk", status=status)
    db.add(appointment)
    db.commit()
    return appointment


@pytest.fixture
def people(make_user):
    student = make_user(UserRole.student, "Asha")
    counsellor = make_user(UserRole.counsellor, "Dr. Rao")
    return student, counsellor


# ---------- Student ----------

def test_student_dashboard_without_data(client, db, people):
    seed_default_resources(db)
    (_, headers), _ = people
    body = client.get("/api/dashboard/student", headers=headers).json()
    assert body["checkin_done_today"] is False
    assert len(body["trend"]) == 7 and all(p["mood"] is None for p in body["trend"])
    assert len(body["recommendations"]) == 3
    assert body["next_appointment"] is None


def test_student_dashboard_with_data(client, db, people):
    seed_default_resources(db)
    (student, headers), (counsellor, _) = people
    db.add(WellbeingEntry(student_id=student.id, entry_date=date.today(), mood=2, stress=4, sleep_hours=5))
    now = datetime.now(timezone.utc)
    add_appointment(db, student, counsellor, now + timedelta(days=3))
    soonest = add_appointment(db, student, counsellor, now + timedelta(days=1), AppointmentStatus.confirmed)
    add_appointment(db, student, counsellor, now + timedelta(hours=2), AppointmentStatus.cancelled)  # ignored
    add_appointment(db, student, counsellor, now - timedelta(days=1), AppointmentStatus.confirmed)  # past, ignored

    body = client.get("/api/dashboard/student", headers=headers).json()
    assert body["checkin_done_today"] is True
    assert body["trend"][-1] == {"date": date.today().isoformat(), "mood": 2, "stress": 4, "sleep_hours": 5.0}
    assert body["recommendations"][0]["score"] > 0
    assert body["next_appointment"]["id"] == soonest.id
    assert body["next_appointment"]["counsellor_name"] == "Dr. Rao"
    assert "counsellor_notes" not in body["next_appointment"]


# ---------- Counsellor ----------

def test_counsellor_dashboard(client, db, people, make_user):
    (student, _), (counsellor, headers) = people
    other_counsellor, _ = make_user(UserRole.counsellor)
    today_noon = datetime.combine(date.today(), time(12)).astimezone()
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)

    todays = add_appointment(db, student, counsellor, today_noon, AppointmentStatus.confirmed)
    add_appointment(db, student, counsellor, today_noon + timedelta(hours=2), AppointmentStatus.cancelled)  # not shown
    pending = add_appointment(db, student, counsellor, tomorrow)
    add_appointment(db, student, other_counsellor, tomorrow + timedelta(hours=3))  # someone else's
    create_crisis_alert(db, student.id, AlertSource.chat, "want_to_die")
    db.commit()

    body = client.get("/api/dashboard/counsellor", headers=headers).json()
    assert body["open_alerts"] == 1
    assert [a["id"] for a in body["todays_appointments"]] == [todays.id]
    assert [a["id"] for a in body["pending_requests"]] == [pending.id]
    assert body["pending_requests"][0]["student_name"] == "Asha"


# ---------- Access ----------

def test_dashboard_access_rules(client, make_headers):
    student, counsellor, admin = (make_headers(r) for r in (UserRole.student, UserRole.counsellor, UserRole.admin))
    assert client.get("/api/dashboard/student", headers=counsellor).status_code == 403
    assert client.get("/api/dashboard/student", headers=admin).status_code == 403
    assert client.get("/api/dashboard/counsellor", headers=student).status_code == 403
    assert client.get("/api/dashboard/counsellor", headers=admin).status_code == 403
    assert client.get("/api/dashboard/student").status_code == 401
