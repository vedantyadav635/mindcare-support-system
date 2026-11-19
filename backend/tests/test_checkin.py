from datetime import date, timedelta

import pytest

from app.models import AlertSource, CheckinAnswer, CrisisAlert, RiskLevel, UserRole, WellbeingEntry
from app.services.checkin import seed_default_questions

MOOD_QUESTION = {
    "text": "Mood?",
    "answer_type": "option",
    "metric": "mood",
    "options": [{"label": "Low", "value": 1}, {"label": "High", "value": 5}],
}


@pytest.fixture
def questions(client, db, make_headers):
    """Seed the 7 default questions and return them as the API shows them."""
    seed_default_questions(db)
    return client.get("/api/checkin/questions", headers=make_headers(UserRole.student)).json()


def answers_for(questions, mood=4, stress=2, sleep=7.5, text="Exams next week"):
    """Answers for every question: the given mood/stress/sleep, first option elsewhere, text for text questions."""
    answers = []
    for q in questions:
        if q["answer_type"] == "text":
            answers.append({"question_id": q["id"], "text_answer": text})
        else:
            value = {"mood": mood, "stress": stress, "sleep": sleep}.get(q["metric"], q["options"][0]["value"])
            answers.append({"question_id": q["id"], "option_value": value})
    return answers


def by_metric(questions, metric):
    return next(q for q in questions if q["metric"] == metric)


# ---------- Questions ----------

def test_admin_can_create_update_and_delete_question(client, make_headers):
    admin = make_headers(UserRole.admin)
    created = client.post("/api/admin/checkin/questions", json=MOOD_QUESTION, headers=admin)
    assert created.status_code == 201
    question_id = created.json()["id"]

    updated = client.put(
        f"/api/admin/checkin/questions/{question_id}",
        json={**MOOD_QUESTION, "text": "How is your mood?"},
        headers=admin,
    )
    assert updated.status_code == 200
    assert updated.json()["text"] == "How is your mood?"

    assert client.delete(f"/api/admin/checkin/questions/{question_id}", headers=admin).status_code == 204
    # Soft-deleted: no longer listed
    assert client.get("/api/checkin/questions", headers=admin).json() == []


def test_text_question_gets_default_max_length(client, make_headers):
    response = client.post(
        "/api/admin/checkin/questions",
        json={"text": "Anything else?", "answer_type": "text"},
        headers=make_headers(UserRole.admin),
    )
    assert response.json()["max_length"] == 300


@pytest.mark.parametrize(
    "bad_question",
    [
        {**MOOD_QUESTION, "options": [{"label": "Only one", "value": 1}]},  # fewer than 2 options
        {**MOOD_QUESTION, "options": [{"label": "A", "value": 1}, {"label": "B", "value": "x"}]},  # not a number
        {**MOOD_QUESTION, "options": [{"label": "A", "value": 1}, {"label": "B", "value": 6}]},  # mood > 5
        {**MOOD_QUESTION, "options": [{"label": "A", "value": 1}, {"label": "B", "value": 2.5}]},  # mood not whole
        {"text": "Notes", "answer_type": "text", "options": MOOD_QUESTION["options"]},  # text with options
        {"text": "Notes", "answer_type": "text", "metric": "stress"},  # metric on text
    ],
)
def test_invalid_question_is_rejected(client, make_headers, bad_question):
    response = client.post("/api/admin/checkin/questions", json=bad_question, headers=make_headers(UserRole.admin))
    assert response.status_code == 422


def test_only_one_active_question_per_metric(client, make_headers):
    admin = make_headers(UserRole.admin)
    client.post("/api/admin/checkin/questions", json=MOOD_QUESTION, headers=admin)
    second = client.post("/api/admin/checkin/questions", json=MOOD_QUESTION, headers=admin)
    assert second.status_code == 409


def test_student_cannot_manage_questions(client, make_headers):
    student = make_headers(UserRole.student)
    assert client.post("/api/admin/checkin/questions", json=MOOD_QUESTION, headers=student).status_code == 403
    assert client.put("/api/admin/checkin/questions/1", json=MOOD_QUESTION, headers=student).status_code == 403
    assert client.delete("/api/admin/checkin/questions/1", headers=student).status_code == 403


# ---------- Check-in ----------

def test_full_checkin_saves_answers_and_fills_scores(client, db, make_headers, questions):
    student = make_headers(UserRole.student)
    response = client.post("/api/checkin", json={"answers": answers_for(questions)}, headers=student)
    assert response.status_code == 200
    body = response.json()
    assert (body["mood"], body["stress"], body["sleep_hours"]) == (4, 2, 7.5)
    assert body["crisis"] is False
    assert body["entry_date"] == date.today().isoformat()

    assert db.query(CheckinAnswer).filter_by(entry_id=body["entry_id"]).count() == 7
    mood_answer = db.query(CheckinAnswer).filter_by(
        entry_id=body["entry_id"], question_id=by_metric(questions, "mood")["id"]
    ).one()
    assert mood_answer.option_label == "Good"  # label copied from the question's options

    today = client.get("/api/checkin/today", headers=student).json()
    assert today["done"] is True
    assert len(today["entry"]["answers"]) == 7


def test_resubmitting_same_day_replaces_answers(client, db, make_headers, questions):
    student = make_headers(UserRole.student)
    first = client.post("/api/checkin", json={"answers": answers_for(questions, mood=2)}, headers=student).json()
    second = client.post("/api/checkin", json={"answers": answers_for(questions, mood=5)}, headers=student).json()

    assert second["entry_id"] == first["entry_id"]  # same row, updated
    assert second["mood"] == 5
    assert db.query(WellbeingEntry).count() == 1
    assert db.query(CheckinAnswer).count() == 7  # old answers replaced, not added


def test_optional_text_questions_can_be_skipped(client, make_headers, questions):
    answers = [a for a in answers_for(questions) if "text_answer" not in a]
    response = client.post("/api/checkin", json={"answers": answers}, headers=make_headers(UserRole.student))
    assert response.status_code == 200


def test_invalid_option_value_is_rejected(client, make_headers, questions):
    answers = answers_for(questions, mood=9)  # 9 is not one of the mood options
    response = client.post("/api/checkin", json={"answers": answers}, headers=make_headers(UserRole.student))
    assert response.status_code == 422


def test_too_long_text_is_rejected(client, make_headers, questions):
    answers = answers_for(questions, text="x" * 301)
    response = client.post("/api/checkin", json={"answers": answers}, headers=make_headers(UserRole.student))
    assert response.status_code == 422


def test_missing_required_question_is_rejected(client, make_headers, questions):
    mood_id = by_metric(questions, "mood")["id"]
    answers = [a for a in answers_for(questions) if a["question_id"] != mood_id]
    response = client.post("/api/checkin", json={"answers": answers}, headers=make_headers(UserRole.student))
    assert response.status_code == 422


def test_future_date_is_rejected(client, make_headers, questions):
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    response = client.post(
        "/api/checkin",
        json={"entry_date": tomorrow, "answers": answers_for(questions)},
        headers=make_headers(UserRole.student),
    )
    assert response.status_code == 422


def test_counsellor_cannot_check_in(client, make_headers, questions):
    response = client.post(
        "/api/checkin", json={"answers": answers_for(questions)}, headers=make_headers(UserRole.counsellor)
    )
    assert response.status_code == 403


def test_students_only_see_their_own_history(client, make_headers, questions):
    alice, bob = make_headers(UserRole.student), make_headers(UserRole.student)
    client.post("/api/checkin", json={"answers": answers_for(questions)}, headers=alice)

    assert len(client.get("/api/checkin/history", headers=alice).json()) == 1
    assert client.get("/api/checkin/history", headers=bob).json() == []
    assert client.get("/api/checkin/today", headers=bob).json() == {"done": False, "entry": None}


def test_history_is_oldest_first_and_filtered_by_date(client, make_headers, questions):
    student = make_headers(UserRole.student)
    today = date.today()
    for days_ago in (0, 2, 5):
        day = (today - timedelta(days=days_ago)).isoformat()
        client.post("/api/checkin", json={"entry_date": day, "answers": answers_for(questions)}, headers=student)

    history = client.get("/api/checkin/history", headers=student).json()
    assert [e["entry_date"] for e in history] == sorted(e["entry_date"] for e in history)
    assert history[0]["answers"][0]["question_text"] == "How is your mood today?"

    since = (today - timedelta(days=3)).isoformat()
    assert len(client.get(f"/api/checkin/history?from={since}", headers=student).json()) == 2


# ---------- Safety ----------

def test_risky_text_answer_creates_alert_and_returns_crisis_response(client, db, make_headers, questions):
    # ~140 chars: fits both text questions (max 200) but is longer than the 120-char excerpt
    long_risky = "I have been feeling empty for weeks and honestly I want to end my life, " + "nothing helps " * 5
    response = client.post(
        "/api/checkin", json={"answers": answers_for(questions, text=long_risky)}, headers=make_headers(UserRole.student)
    )
    assert response.status_code == 200
    body = response.json()
    assert body["crisis"] is True
    crisis = body["crisis_response"]
    assert any("14416" in h["contact"] for h in crisis["helplines"])
    assert any("112" in h["contact"] for h in crisis["helplines"])
    assert crisis["show_urgent_booking"] is True

    # Both text questions got the risky text -> both answers marked, one alert each
    assert db.query(CheckinAnswer).filter_by(risk_level=RiskLevel.high).count() == 2
    alerts = db.query(CrisisAlert).all()
    assert len(alerts) == 2
    assert all(a.source == AlertSource.checkin and a.matched_rule == "take_my_life" for a in alerts)
    # Counsellors only get a short excerpt, not the whole answer
    assert all(len(a.excerpt) <= 121 and a.excerpt.endswith("…") for a in alerts)


def test_normal_checkin_has_no_alert(client, db, make_headers, questions):
    body = client.post(
        "/api/checkin",
        json={"answers": answers_for(questions, text="Exams are stressful but I'm managing")},
        headers=make_headers(UserRole.student),
    ).json()
    assert body["crisis"] is False and body["crisis_response"] is None
    assert db.query(CrisisAlert).count() == 0
    assert db.query(CheckinAnswer).filter_by(risk_level=RiskLevel.high).count() == 0


def test_hinglish_risky_answer_is_caught(client, db, make_headers, questions):
    body = client.post(
        "/api/checkin",
        json={"answers": answers_for(questions, text="jeene ka mann nahi karta")},
        headers=make_headers(UserRole.student),
    ).json()
    assert body["crisis"] is True
    assert db.query(CrisisAlert).count() == 2


# ---------- Trends ----------

def test_trends_shape(client, make_headers, questions):
    student = make_headers(UserRole.student)
    today = date.today()
    for days_ago, mood in ((0, 4), (1, 2)):
        day = (today - timedelta(days=days_ago)).isoformat()
        client.post(
            "/api/checkin", json={"entry_date": day, "answers": answers_for(questions, mood=mood)}, headers=student
        )

    week = client.get("/api/wellbeing/trends?period=week", headers=student).json()
    assert len(week["points"]) == 7
    assert set(week["points"][0]) == {"date", "mood", "stress", "sleep_hours"}
    assert week["points"][-1] == {"date": today.isoformat(), "mood": 4, "stress": 2, "sleep_hours": 7.5}
    assert week["points"][0]["mood"] is None  # 6 days ago: no entry
    assert week["summary"] == {
        "avg_mood": 3.0, "avg_stress": 2.0, "avg_sleep": 7.5, "entries_count": 2, "streak_days": 2,
    }

    month = client.get("/api/wellbeing/trends?period=month", headers=student).json()
    assert 1 <= len(month["points"]) <= 2  # today and yesterday may fall in different weeks
    assert set(month["points"][0]) == {"week_start", "avg_mood", "avg_stress", "avg_sleep"}
    assert month["summary"]["entries_count"] == 2

    assert client.get("/api/wellbeing/trends?period=year", headers=student).status_code == 422
