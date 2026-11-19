from datetime import date, datetime, timedelta, timezone

import pytest

from app.models import AlertSource, Assessment, AssessmentType, ChatMessage, ChatSender, Resource, ResourceType, UserRole, WellbeingEntry
from app.services.escalation import create_crisis_alert
from app.services.recommender import COUNSELLING_WHY, DEFAULT_WHY, WEIGHTS, compute_signals, rank, score_resource
from app.services.resource import seed_default_resources


def resource(id, tags, type=ResourceType.activity, title=None):
    """An in-memory resource (not saved) for pure scoring tests."""
    return Resource(id=id, title=title or f"r{id}", type=type, tags=tags, body="x", is_active=True)


# ---------- Signals ----------

def test_weights_add_up_to_one():
    assert sum(WEIGHTS.values()) == pytest.approx(1.0)


def test_compute_signals_scales_each_signal_0_to_1():
    s = compute_signals(avg_mood=2, avg_stress=4, avg_sleep=5.25, emotion_counts={"sadness": 3, "joy": 1})
    assert s.low_mood == pytest.approx(0.75)  # (5 - 2) / 4
    assert s.stress == pytest.approx(0.75)  # (4 - 1) / 4
    assert s.sleep_deficit == pytest.approx(0.25)  # (7 - 5.25) / 7
    assert s.emotion_share == {"sadness": 0.75, "joy": 0.25}


def test_compute_signals_extremes_and_no_data():
    best = compute_signals(avg_mood=5, avg_stress=1, avg_sleep=9, emotion_counts={})
    assert (best.low_mood, best.stress, best.sleep_deficit) == (0, 0, 0)  # no concern; >7h sleep is not negative
    worst = compute_signals(avg_mood=1, avg_stress=5, avg_sleep=0, emotion_counts={})
    assert (worst.low_mood, worst.stress, worst.sleep_deficit) == (1, 1, 1)
    empty = compute_signals(None, None, None, {})
    assert not empty.has_data and empty.low_mood == 0


# ---------- Scoring one resource ----------

SIGNALS = compute_signals(avg_mood=2, avg_stress=4, avg_sleep=5.2, emotion_counts={"sadness": 3, "fear": 1})


def test_score_combines_matching_signals():
    # low_mood (0.35 * 0.75) + emotion "sadness" (0.15 * 0.75)
    score, why = score_resource(["low_mood", "sadness"], SIGNALS)
    assert score == pytest.approx(0.35 * 0.75 + 0.15 * 0.75, abs=0.001)
    assert why == "Because your mood averaged 2.0/5 this week"  # the biggest part


def test_score_sleep_resource_explains_sleep():
    score, why = score_resource(["sleep"], SIGNALS)
    assert score == pytest.approx(0.20 * (7 - 5.2) / 7, abs=0.001)
    assert why == "Because your sleep averaged 5.2 hours this week"


def test_score_stress_and_anxiety_count_once():
    score, why = score_resource(["stress", "anxiety"], SIGNALS)
    assert score == pytest.approx(0.30 * 0.75, abs=0.001)
    assert why == "Because your stress averaged 4.0/5 this week"


def test_emotion_only_resource_explains_chat_emotion():
    signals = compute_signals(None, None, None, {"fear": 2, "neutral": 2})
    score, why = score_resource(["fear"], signals)
    assert score == pytest.approx(0.15 * 0.5)
    assert why == "Because 50% of your recent chat messages sounded anxious or scared"


def test_unrelated_resource_scores_zero():
    assert score_resource(["academic"], SIGNALS) == (0.0, None)
    assert score_resource(["stress"], compute_signals(None, None, None, {})) == (0.0, None)


# ---------- Ranking ----------

RESOURCES = [
    resource(1, ["sleep"]),
    resource(2, ["stress", "anxiety"]),
    resource(3, ["low_mood", "sadness"]),
    resource(4, ["academic"]),
    resource(5, ["loneliness"]),
    resource(6, ["low_mood", "stress"], type=ResourceType.counselling, title="Book a counsellor"),
    resource(7, ["crisis"], type=ResourceType.counselling, title="Helpline"),
]


def test_rank_orders_by_score_and_never_includes_crisis_resource():
    result = rank(RESOURCES, SIGNALS, needs_counsellor=False, limit=7)
    scores = [rec.score for rec in result]
    assert scores == sorted(scores, reverse=True)
    assert result[0].resource.id == 6  # low_mood + stress: highest
    assert 7 not in [rec.resource.id for rec in result]


def test_rank_puts_counselling_first_when_needed():
    # Mood fine, only a little sleep loss: counselling would normally rank low
    signals = compute_signals(avg_mood=5, avg_stress=1, avg_sleep=6, emotion_counts={})
    result = rank(RESOURCES, signals, needs_counsellor=True, limit=3)
    assert result[0].resource.id == 6
    assert result[0].why == COUNSELLING_WHY
    assert len(result) == 3


def test_rank_without_data_returns_varied_defaults():
    result = rank(RESOURCES, compute_signals(None, None, None, {}), needs_counsellor=False, limit=4)
    assert [rec.resource.id for rec in result] == [2, 1, 3, 5]  # one per DEFAULT_TAGS tag: stress, sleep, low_mood, loneliness
    assert all(rec.score == 0 and rec.why == DEFAULT_WHY for rec in result)


# ---------- API (database) ----------

@pytest.fixture
def student(make_user, db):
    seed_default_resources(db)
    return make_user(UserRole.student)


def get(client, headers):
    response = client.get("/api/recommendations", headers=headers)
    assert response.status_code == 200
    return response.json()


def test_api_no_data_gives_default_list(client, student):
    items = get(client, student[1])
    assert len(items) == 5
    assert all(item["why"] == DEFAULT_WHY and item["score"] == 0 for item in items)
    assert all("crisis" not in item["resource"]["tags"] for item in items)


def test_api_poor_sleep_recommends_sleep_resources(client, db, student):
    user, headers = student
    for days_ago, hours in ((0, 4.5), (1, 5.5)):  # averages 5.0 hours; mood and stress fine
        db.add(WellbeingEntry(student_id=user.id, entry_date=date.today() - timedelta(days=days_ago), mood=5, stress=1, sleep_hours=hours))
    db.commit()

    top = get(client, headers)[0]
    assert "sleep" in top["resource"]["tags"]
    assert top["why"] == "Because your sleep averaged 5.0 hours this week"
    assert top["score"] > 0


def test_api_old_entries_are_ignored(client, db, student):
    user, headers = student
    db.add(WellbeingEntry(student_id=user.id, entry_date=date.today() - timedelta(days=10), mood=1, stress=5, sleep_hours=2))
    db.commit()
    assert all(item["why"] == DEFAULT_WHY for item in get(client, headers))


def test_api_chat_emotions_are_used(client, db, student):
    user, headers = student
    for emotion in ("anger", "anger", "neutral"):
        db.add(ChatMessage(student_id=user.id, sender=ChatSender.student, text="...", emotion=emotion))
    db.commit()
    top = get(client, headers)[0]
    assert "anger" in top["resource"]["tags"]
    assert top["why"] == "Because 67% of your recent chat messages sounded angry"


@pytest.mark.parametrize("band, counselling_first", [("moderate", True), ("severe", True), ("mild", False)])
def test_api_recent_assessment_band(client, db, student, band, counselling_first):
    user, headers = student
    db.add(Assessment(student_id=user.id, type=AssessmentType.PHQ9, answers=[1] * 9, total_score=10, severity_band=band))
    db.commit()
    first = get(client, headers)[0]
    assert (first["resource"]["type"] == "counselling") is counselling_first


def test_api_old_assessment_is_ignored(client, db, student):
    user, headers = student
    db.add(Assessment(
        student_id=user.id, type=AssessmentType.PHQ9, answers=[2] * 9, total_score=18, severity_band="moderately severe",
        created_at=datetime.now(timezone.utc) - timedelta(days=20),
    ))
    db.commit()
    assert get(client, headers)[0]["resource"]["type"] != "counselling"


def test_api_open_crisis_alert_puts_counselling_first(client, db, student):
    user, headers = student
    create_crisis_alert(db, user.id, AlertSource.chat, "want_to_die")
    db.commit()
    first = get(client, headers)[0]
    assert first["resource"]["title"] == "Book a session with a counsellor"
    assert first["why"] == COUNSELLING_WHY


def test_api_students_only(client, make_headers):
    assert client.get("/api/recommendations", headers=make_headers(UserRole.counsellor)).status_code == 403
