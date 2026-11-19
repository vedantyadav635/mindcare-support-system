import threading
from datetime import datetime, timedelta, timezone

import pytest

from app.models import Appointment, AvailabilitySlot, CounsellorProfile, UserRole
from app.schemas.appointment import BookingIn
from app.services import appointment as service
from tests.conftest import TestSessionLocal

TOMORROW_10AM = (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)


def at(hours: float) -> str:
    """ISO time `hours` after tomorrow 10:00 UTC, e.g. at(1) = tomorrow 11:00."""
    return (TOMORROW_10AM + timedelta(hours=hours)).isoformat()


@pytest.fixture
def counsellor(make_user, db):
    user, headers = make_user(UserRole.counsellor, "Dr. Rao")
    db.add(CounsellorProfile(user_id=user.id, qualification="M.Phil", specialization="Stress", phone="9999999999"))
    db.commit()
    return user, headers


@pytest.fixture
def student(make_user):
    return make_user(UserRole.student, "Asha")


@pytest.fixture
def slot_id(client, counsellor):
    """An open slot tomorrow 10:00-11:00."""
    return client.post("/api/slots", json={"start_time": at(0), "end_time": at(1)}, headers=counsellor[1]).json()["id"]


def book(client, headers, slot_id):
    return client.post("/api/appointments", json={"slot_id": slot_id, "reason": "Exam stress"}, headers=headers)


def patch(client, headers, appointment_id, **body):
    return client.patch(f"/api/appointments/{appointment_id}", json=body, headers=headers)


# ---------- Slots ----------

def test_counsellor_creates_and_lists_slots(client, counsellor, slot_id):
    slots = client.get("/api/slots/mine", headers=counsellor[1]).json()
    assert [s["id"] for s in slots] == [slot_id]
    assert slots[0]["is_booked"] is False


@pytest.mark.parametrize(
    "body",
    [
        {"start_time": at(1), "end_time": at(0)},  # ends before it starts
        {"start_time": at(1), "end_time": at(1)},  # zero length
        {"start_time": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
         "end_time": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()},  # in the past
        {"start_time": "2030-01-01T10:00:00", "end_time": "2030-01-01T11:00:00"},  # no timezone
    ],
)
def test_invalid_slot_is_rejected(client, counsellor, body):
    assert client.post("/api/slots", json=body, headers=counsellor[1]).status_code == 422


def test_overlapping_slot_is_rejected_but_adjacent_is_fine(client, counsellor, slot_id):
    headers = counsellor[1]
    assert client.post("/api/slots", json={"start_time": at(0.5), "end_time": at(1.5)}, headers=headers).status_code == 409
    assert client.post("/api/slots", json={"start_time": at(-1), "end_time": at(2)}, headers=headers).status_code == 409
    # 11:00-12:00 touches 10:00-11:00 but does not overlap
    assert client.post("/api/slots", json={"start_time": at(1), "end_time": at(2)}, headers=headers).status_code == 201


def test_other_counsellors_can_use_the_same_time(client, make_headers, slot_id):
    other = make_headers(UserRole.counsellor)
    assert client.post("/api/slots", json={"start_time": at(0), "end_time": at(1)}, headers=other).status_code == 201


def test_student_cannot_create_slot(client, student):
    assert client.post("/api/slots", json={"start_time": at(0), "end_time": at(1)}, headers=student[1]).status_code == 403


def test_delete_slot_rules(client, counsellor, student, make_headers, slot_id):
    # Another counsellor can't delete it
    assert client.delete(f"/api/slots/{slot_id}", headers=make_headers(UserRole.counsellor)).status_code == 404
    # A booked slot can't be deleted
    book(client, student[1], slot_id)
    assert client.delete(f"/api/slots/{slot_id}", headers=counsellor[1]).status_code == 409
    # A free slot can
    free = client.post("/api/slots", json={"start_time": at(2), "end_time": at(3)}, headers=counsellor[1]).json()
    assert client.delete(f"/api/slots/{free['id']}", headers=counsellor[1]).status_code == 204


# ---------- Counsellors and available slots ----------

def test_counsellor_list_hides_contact_details(client, counsellor, student):
    counsellors = client.get("/api/counsellors", headers=student[1]).json()
    assert counsellors == [
        {"id": counsellor[0].id, "full_name": "Dr. Rao", "qualification": "M.Phil", "specialization": "Stress"}
    ]


def test_available_slots_are_future_and_unbooked(client, db, counsellor, student, slot_id):
    # A past slot (inserted directly, the API refuses to create one)
    now = datetime.now(timezone.utc)
    db.add(AvailabilitySlot(counsellor_id=counsellor[0].id, start_time=now - timedelta(hours=2), end_time=now - timedelta(hours=1)))
    db.commit()
    booked = client.post("/api/slots", json={"start_time": at(2), "end_time": at(3)}, headers=counsellor[1]).json()
    book(client, student[1], booked["id"])

    available = client.get(f"/api/slots/available?counsellor_id={counsellor[0].id}", headers=student[1]).json()
    assert [s["id"] for s in available] == [slot_id]
    assert client.get("/api/slots/available?counsellor_id=999", headers=student[1]).json() == []


# ---------- Booking ----------

def test_booking_creates_requested_appointment_and_books_slot(client, db, counsellor, student, slot_id):
    response = book(client, student[1], slot_id)
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "requested"
    assert body["counsellor_name"] == "Dr. Rao" and body["student_name"] == "Asha"
    assert "counsellor_notes" not in body
    assert db.get(AvailabilitySlot, slot_id).is_booked is True


def test_double_booking_returns_409(client, make_headers, student, slot_id):
    assert book(client, student[1], slot_id).status_code == 201
    assert book(client, make_headers(UserRole.student), slot_id).status_code == 409


def test_simultaneous_bookings_only_one_wins(make_user, slot_id):
    """Two students book the same slot at the same moment, each in its own DB session (like two requests)."""
    students = [make_user(UserRole.student)[0], make_user(UserRole.student)[0]]
    start_together = threading.Barrier(2)
    results = []

    def try_to_book(student):
        session = TestSessionLocal()
        try:
            start_together.wait()
            service.book_appointment(session, student, BookingIn(slot_id=slot_id, reason="Help"))
            results.append("booked")
        except service.Conflict:
            results.append("conflict")
        finally:
            session.close()

    threads = [threading.Thread(target=try_to_book, args=(s,)) for s in students]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert sorted(results) == ["booked", "conflict"]


def test_booking_missing_slot_returns_404(client, student):
    assert book(client, student[1], 999).status_code == 404


def test_counsellor_cannot_book(client, counsellor, slot_id):
    assert book(client, counsellor[1], slot_id).status_code == 403


# ---------- Status changes ----------

@pytest.fixture
def appointment_id(client, student, slot_id):
    return book(client, student[1], slot_id).json()["id"]


def test_counsellor_confirms_then_completes(client, counsellor, appointment_id):
    assert patch(client, counsellor[1], appointment_id, status="confirmed").json()["status"] == "confirmed"
    assert patch(client, counsellor[1], appointment_id, status="completed").json()["status"] == "completed"


@pytest.mark.parametrize(
    "path",
    [
        ["completed"],  # requested -> completed: must be confirmed first
        ["requested"],  # requested -> requested: not a move
        ["confirmed", "requested"],  # can't go backwards
        ["confirmed", "completed", "cancelled"],  # completed is final
        ["cancelled", "confirmed"],  # cancelled is final
    ],
)
def test_blocked_status_changes(client, counsellor, appointment_id, path):
    *allowed, blocked = path
    for status in allowed:
        assert patch(client, counsellor[1], appointment_id, status=status).status_code == 200
    assert patch(client, counsellor[1], appointment_id, status=blocked).status_code == 409


def test_cancelling_frees_slot_for_rebooking(client, db, counsellor, make_headers, slot_id, appointment_id):
    assert patch(client, counsellor[1], appointment_id, status="cancelled").status_code == 200
    assert db.get(AvailabilitySlot, slot_id).is_booked is False
    # Another student can now book the same slot (the cancelled row stays as history)
    assert book(client, make_headers(UserRole.student), slot_id).status_code == 201
    assert db.query(Appointment).filter_by(slot_id=slot_id).count() == 2


def test_student_can_cancel_own_appointment(client, student, counsellor, appointment_id):
    patch(client, counsellor[1], appointment_id, status="confirmed")
    response = patch(client, student[1], appointment_id, status="cancelled")
    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


def test_student_cannot_confirm_complete_or_write_notes(client, student, appointment_id):
    assert patch(client, student[1], appointment_id, status="confirmed").status_code == 403
    assert patch(client, student[1], appointment_id, status="completed").status_code == 403
    assert patch(client, student[1], appointment_id, counsellor_notes="hi").status_code == 403


def test_others_cannot_touch_the_appointment(client, make_headers, appointment_id):
    assert patch(client, make_headers(UserRole.student), appointment_id, status="cancelled").status_code == 404
    assert patch(client, make_headers(UserRole.counsellor), appointment_id, status="confirmed").status_code == 404
    assert patch(client, make_headers(UserRole.admin), appointment_id, status="confirmed").status_code == 403


# ---------- Listing and privacy of notes ----------

def test_counsellor_notes_are_never_shown_to_students(client, counsellor, student, appointment_id):
    response = patch(client, counsellor[1], appointment_id, counsellor_notes="Discussed exam anxiety")
    assert response.json()["counsellor_notes"] == "Discussed exam anxiety"

    counsellor_view = client.get("/api/appointments/mine", headers=counsellor[1]).json()
    assert counsellor_view[0]["counsellor_notes"] == "Discussed exam anxiety"

    student_view = client.get("/api/appointments/mine", headers=student[1]).json()
    assert "counsellor_notes" not in student_view[0]

    # Not even in the response to the student's own cancel
    assert "counsellor_notes" not in patch(client, student[1], appointment_id, status="cancelled").json()


def test_mine_shows_only_own_appointments_with_names_and_times(client, counsellor, student, make_headers, appointment_id):
    mine = client.get("/api/appointments/mine", headers=student[1]).json()
    assert len(mine) == 1
    assert mine[0]["student_name"] == "Asha" and mine[0]["counsellor_name"] == "Dr. Rao"
    assert datetime.fromisoformat(mine[0]["start_time"]) == TOMORROW_10AM

    assert client.get("/api/appointments/mine", headers=make_headers(UserRole.student)).json() == []
    assert client.get("/api/appointments/mine", headers=make_headers(UserRole.counsellor)).json() == []
    assert client.get("/api/appointments/mine", headers=make_headers(UserRole.admin)).status_code == 403
