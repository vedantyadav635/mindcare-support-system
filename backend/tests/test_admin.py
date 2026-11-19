from datetime import datetime, timedelta, timezone

import pytest

from app.models import AlertSource, Appointment, AvailabilitySlot, CounsellorProfile, UserRole
from app.services.escalation import create_crisis_alert

NEW_COUNSELLOR = {
    "email": "Dr.Rao@College.edu",
    "full_name": "Dr. Rao",
    "qualification": "M.Phil Clinical Psychology",
    "specialization": "Anxiety",
    "phone": "9876543210",
}


@pytest.fixture
def admin(make_user):
    return make_user(UserRole.admin, "Admin")


# ---------- Users ----------

def test_list_users_filters_searches_and_paginates(client, make_user, admin):
    make_user(UserRole.student, "Asha Patel")
    make_user(UserRole.student, "Rahul Verma")
    make_user(UserRole.counsellor, "Dr. Mehta")
    headers = admin[1]

    everyone = client.get("/api/admin/users", headers=headers).json()
    assert everyone["total"] == 4  # 3 + the admin

    students = client.get("/api/admin/users?role=student", headers=headers).json()
    assert {u["full_name"] for u in students["items"]} == {"Asha Patel", "Rahul Verma"}

    found = client.get("/api/admin/users?search=patel", headers=headers).json()  # case-insensitive
    assert [u["full_name"] for u in found["items"]] == ["Asha Patel"]

    page2 = client.get("/api/admin/users?page=2&page_size=3", headers=headers).json()
    assert page2["total"] == 4 and len(page2["items"]) == 1
    assert "password_hash" not in page2["items"][0]


def test_create_counsellor_with_temporary_password(client, db, admin):
    response = client.post("/api/admin/counsellors", json=NEW_COUNSELLOR, headers=admin[1])
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["role"] == "counsellor"
    assert body["user"]["email"] == "dr.rao@college.edu"
    assert len(body["temporary_password"]) >= 12
    assert db.query(CounsellorProfile).filter_by(user_id=body["user"]["id"]).one().specialization == "Anxiety"

    # The counsellor can log in with the temporary password
    login = client.post("/api/auth/login", json={"email": NEW_COUNSELLOR["email"], "password": body["temporary_password"]})
    assert login.status_code == 200 and login.json()["role"] == "counsellor"

    assert client.post("/api/admin/counsellors", json=NEW_COUNSELLOR, headers=admin[1]).status_code == 409


def test_deactivate_user_locks_them_out_immediately(client, make_user, admin):
    student, student_headers = make_user(UserRole.student)
    assert client.get("/api/auth/me", headers=student_headers).status_code == 200

    response = client.patch(f"/api/admin/users/{student.id}", json={"is_active": False}, headers=admin[1])
    assert response.status_code == 200 and response.json()["is_active"] is False
    assert client.get("/api/auth/me", headers=student_headers).status_code == 401  # old token rejected

    client.patch(f"/api/admin/users/{student.id}", json={"is_active": True}, headers=admin[1])
    assert client.get("/api/auth/me", headers=student_headers).status_code == 200


def test_admin_cannot_deactivate_self_and_missing_user_is_404(client, admin):
    user, headers = admin
    assert client.patch(f"/api/admin/users/{user.id}", json={"is_active": False}, headers=headers).status_code == 409
    assert client.patch("/api/admin/users/999", json={"is_active": False}, headers=headers).status_code == 404


# ---------- Stats ----------

def test_stats_are_counts_only(client, db, make_user, admin):
    student, student_headers = make_user(UserRole.student, "Asha")
    counsellor, _ = make_user(UserRole.counsellor, "Dr. Rao")
    client.post("/api/assessments", json={"type": "GAD7", "answers": [0] * 7}, headers=student_headers)
    create_crisis_alert(db, student.id, AlertSource.chat, "want_to_die", excerpt="private words")
    start = datetime.now(timezone.utc) + timedelta(days=1)
    slot = AvailabilitySlot(counsellor_id=counsellor.id, start_time=start, end_time=start + timedelta(hours=1), is_booked=True)
    db.add(slot)
    db.flush()
    db.add(Appointment(student_id=student.id, counsellor_id=counsellor.id, slot_id=slot.id, reason="talk"))
    db.commit()

    stats = client.get("/api/admin/stats", headers=admin[1]).json()
    assert stats == {
        "students": 1,
        "counsellors": 1,
        "wellbeing_entries_this_week": 0,
        "assessments_this_week": 1,
        "appointments_by_status": {"requested": 1, "confirmed": 0, "cancelled": 0, "completed": 0},
        "open_alerts": 1,
    }
    text = str(stats)
    assert "Asha" not in text and "private words" not in text


# ---------- Access ----------

@pytest.mark.parametrize("role", [UserRole.student, UserRole.counsellor])
def test_only_admins_can_use_admin_endpoints(client, make_headers, role):
    headers = make_headers(role)
    assert client.get("/api/admin/users", headers=headers).status_code == 403
    assert client.post("/api/admin/counsellors", json=NEW_COUNSELLOR, headers=headers).status_code == 403
    assert client.patch("/api/admin/users/1", json={"is_active": False}, headers=headers).status_code == 403
    assert client.get("/api/admin/stats", headers=headers).status_code == 403
