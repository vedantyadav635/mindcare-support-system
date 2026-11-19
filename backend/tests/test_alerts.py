from datetime import datetime, timedelta, timezone

import pytest

from app.models import AlertSource, CrisisAlert, UserRole
from app.services.escalation import create_crisis_alert, make_excerpt


@pytest.fixture
def two_alerts(db, make_user):
    """An older closed alert and a newer open one, for student 'Asha'."""
    student, _ = make_user(UserRole.student, "Asha")
    older = create_crisis_alert(db, student.id, AlertSource.assessment, "phq9_item9_self_harm", excerpt="PHQ-9 q9")
    older.status = "closed"
    older.created_at = datetime.now(timezone.utc) - timedelta(days=1)
    newer = create_crisis_alert(db, student.id, AlertSource.checkin, "want_to_die", excerpt="i want to die")
    db.commit()
    return older, newer


def test_counsellor_sees_alerts_newest_first_with_name_and_reason(client, make_headers, two_alerts):
    older, newer = two_alerts
    alerts = client.get("/api/alerts", headers=make_headers(UserRole.counsellor)).json()
    assert [a["id"] for a in alerts] == [newer.id, older.id]
    assert alerts[0]["student_name"] == "Asha"
    assert alerts[0]["excerpt"] == "i want to die"
    assert alerts[0]["reason"] == "Wants or plans to die"  # description from the lexicon
    assert alerts[1]["reason"] == "phq9_item9_self_harm"  # non-lexicon rule falls back to its id


def test_filter_open_alerts(client, make_headers, two_alerts):
    _, newer = two_alerts
    alerts = client.get("/api/alerts?status=open", headers=make_headers(UserRole.counsellor)).json()
    assert [a["id"] for a in alerts] == [newer.id]


def test_patch_alert_records_who_handled_it(client, db, make_user, two_alerts):
    counsellor, headers = make_user(UserRole.counsellor)
    _, newer = two_alerts
    response = client.patch(f"/api/alerts/{newer.id}", json={"status": "seen"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "seen"
    assert response.json()["handled_by"] == counsellor.id
    db.refresh(newer)
    assert newer.handled_by == counsellor.id


def test_patch_missing_alert_or_bad_status(client, make_headers, two_alerts):
    headers = make_headers(UserRole.counsellor)
    assert client.patch("/api/alerts/999", json={"status": "seen"}, headers=headers).status_code == 404
    assert client.patch(f"/api/alerts/{two_alerts[1].id}", json={"status": "ignored"}, headers=headers).status_code == 422


def test_students_and_admins_cannot_see_alerts(client, make_headers, two_alerts):
    for role in (UserRole.student, UserRole.admin):
        headers = make_headers(role)
        assert client.get("/api/alerts", headers=headers).status_code == 403
        assert client.patch(f"/api/alerts/{two_alerts[1].id}", json={"status": "seen"}, headers=headers).status_code == 403


def test_excerpt_is_short_and_cut_at_a_word():
    text = "word " * 100
    excerpt = make_excerpt(text)
    assert len(excerpt) <= 121 and excerpt.endswith("word…")
    assert make_excerpt("short text") == "short text"
