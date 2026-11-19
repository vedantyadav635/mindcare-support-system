from datetime import datetime, timedelta, timezone

from app.models import (
    Appointment,
    Assessment,
    AvailabilitySlot,
    ChatMessage,
    CheckinAnswer,
    CrisisAlert,
    StudentProfile,
    User,
    UserRole,
    WellbeingEntry,
)
from app.services.checkin import seed_default_questions

STUDENT = {
    "email": "asha@college.edu",
    "password": "secret123",
    "full_name": "Asha",
    "enrollment_no": "EN1",
    "department": "CSE",
    "year": 2,
    "consent_given": True,
}


def delete_me(client, headers, password):
    return client.request("DELETE", "/api/me", json={"password": password}, headers=headers)


def test_student_can_delete_account_and_all_data(client, db, make_user):
    # A real student with data in every table
    client.post("/api/auth/register", json=STUDENT)
    token = client.post("/api/auth/login", json={"email": STUDENT["email"], "password": "secret123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    seed_default_questions(db)
    questions = client.get("/api/checkin/questions", headers=headers).json()
    answers = [
        {"question_id": q["id"], "option_value": q["options"][0]["value"]} if q["answer_type"] == "option"
        else {"question_id": q["id"], "text_answer": "fine"}
        for q in questions
    ]
    assert client.post("/api/checkin", json={"answers": answers}, headers=headers).status_code == 200
    client.post("/api/assessments", json={"type": "GAD7", "answers": [0] * 7}, headers=headers)
    client.post("/api/chat/message", json={"text": "I want to die"}, headers=headers)  # creates an alert

    counsellor, counsellor_headers = make_user(UserRole.counsellor)
    start = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    end = (datetime.now(timezone.utc) + timedelta(days=1, hours=1)).isoformat()
    slot_id = client.post("/api/slots", json={"start_time": start, "end_time": end}, headers=counsellor_headers).json()["id"]
    client.post("/api/appointments", json={"slot_id": slot_id, "reason": "talk"}, headers=headers)
    for model in (WellbeingEntry, CheckinAnswer, Assessment, ChatMessage, CrisisAlert, Appointment, StudentProfile):
        assert db.query(model).count() > 0, model.__name__

    assert delete_me(client, headers, "wrong-pass").status_code == 403  # must confirm with the password
    assert delete_me(client, headers, "secret123").status_code == 204

    db.expire_all()
    for model in (WellbeingEntry, CheckinAnswer, Assessment, ChatMessage, CrisisAlert, Appointment, StudentProfile):
        assert db.query(model).count() == 0, f"{model.__name__} not deleted"
    assert db.query(User).filter_by(email=STUDENT["email"]).count() == 0
    assert db.get(AvailabilitySlot, slot_id).is_booked is False  # the counsellor's slot is free again
    assert db.get(User, counsellor.id) is not None  # other users are untouched
    assert client.get("/api/auth/me", headers=headers).status_code == 401  # old token no longer works


def test_only_students_can_delete_themselves(client, make_headers):
    for role in (UserRole.counsellor, UserRole.admin):
        assert delete_me(client, make_headers(role), "whatever").status_code == 403
    assert client.request("DELETE", "/api/me", json={"password": "x"}).status_code == 401
