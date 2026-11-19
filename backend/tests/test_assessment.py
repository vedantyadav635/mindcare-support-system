import pytest

from app.models import AlertSource, AlertStatus, AssessmentType, CrisisAlert, UserRole
from app.services.assessment import severity_band


def answers_with_total(count: int, total: int) -> list[int]:
    """Spread `total` over `count` answers, filling from the first question.
    For PHQ-9 totals up to 24, question 9 (the last) stays 0, so no crisis is triggered."""
    answers = []
    for _ in range(count):
        answers.append(min(3, total))
        total -= answers[-1]
    return answers


# ---------- Scoring ----------

@pytest.mark.parametrize(
    "total, band",
    [(0, "minimal"), (4, "minimal"), (5, "mild"), (9, "mild"), (10, "moderate"), (14, "moderate"),
     (15, "moderately severe"), (19, "moderately severe"), (20, "severe"), (27, "severe")],
)
def test_phq9_band_edges(total, band):
    assert severity_band(AssessmentType.PHQ9, total) == band


@pytest.mark.parametrize(
    "total, band",
    [(0, "minimal"), (4, "minimal"), (5, "mild"), (9, "mild"), (10, "moderate"), (14, "moderate"),
     (15, "severe"), (21, "severe")],
)
def test_gad7_band_edges(total, band):
    assert severity_band(AssessmentType.GAD7, total) == band


@pytest.mark.parametrize(
    "total, band, suggest",
    [(9, "mild", False), (10, "moderate", True), (20, "severe", True)],
)
def test_submit_phq9_returns_band_message_and_disclaimer(client, make_headers, total, band, suggest):
    response = client.post(
        "/api/assessments",
        json={"type": "PHQ9", "answers": answers_with_total(9, total)},
        headers=make_headers(UserRole.student),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total_score"] == total
    assert body["severity_band"] == band
    assert body["suggest_counsellor"] is suggest
    assert body["crisis"] is False and body["crisis_response"] is None
    assert body["message"]
    assert "not a diagnosis" in body["disclaimer"]


def test_submit_gad7(client, make_headers):
    response = client.post(
        "/api/assessments",
        json={"type": "GAD7", "answers": answers_with_total(7, 15)},
        headers=make_headers(UserRole.student),
    )
    assert response.json()["severity_band"] == "severe"


# ---------- Invalid input ----------

@pytest.mark.parametrize(
    "payload",
    [
        {"type": "PHQ9", "answers": [0] * 8},  # too few
        {"type": "PHQ9", "answers": [0] * 10},  # too many
        {"type": "GAD7", "answers": [0] * 9},  # PHQ-9 length for GAD-7
        {"type": "GAD7", "answers": [0] * 6 + [4]},  # above 3
        {"type": "GAD7", "answers": [0] * 6 + [-1]},  # below 0
        {"type": "BDI", "answers": [0] * 7},  # unknown questionnaire
    ],
)
def test_invalid_answers_are_rejected(client, make_headers, payload):
    response = client.post("/api/assessments", json=payload, headers=make_headers(UserRole.student))
    assert response.status_code == 422


def test_counsellor_cannot_submit(client, make_headers):
    response = client.post(
        "/api/assessments", json={"type": "GAD7", "answers": [0] * 7}, headers=make_headers(UserRole.counsellor)
    )
    assert response.status_code == 403


# ---------- Question 9 crisis path ----------

def test_phq9_question9_above_zero_triggers_crisis(client, db, make_headers):
    answers = [0] * 8 + [1]  # total 1 = "minimal", but question 9 > 0
    response = client.post(
        "/api/assessments", json={"type": "PHQ9", "answers": answers}, headers=make_headers(UserRole.student)
    )
    body = response.json()
    assert body["crisis"] is True
    assert body["suggest_counsellor"] is True  # always, in a crisis
    crisis = body["crisis_response"]
    assert any("14416" in h["contact"] for h in crisis["helplines"])
    assert crisis["campus_counsellor"]
    assert crisis["show_urgent_booking"] is True
    assert body["disclaimer"]

    alert = db.query(CrisisAlert).one()
    assert alert.source == AlertSource.assessment
    assert alert.status == AlertStatus.open
    assert alert.excerpt == "PHQ-9 question 9 (thoughts of self-harm) answered: Several days"


def test_no_crisis_alert_when_question9_is_zero(client, db, make_headers):
    client.post(
        "/api/assessments",
        json={"type": "PHQ9", "answers": [3] * 8 + [0]},  # severe, but no self-harm answer
        headers=make_headers(UserRole.student),
    )
    assert db.query(CrisisAlert).count() == 0


def test_gad7_never_triggers_crisis(client, db, make_headers):
    response = client.post(
        "/api/assessments", json={"type": "GAD7", "answers": [3] * 7}, headers=make_headers(UserRole.student)
    )
    assert response.json()["crisis"] is False
    assert db.query(CrisisAlert).count() == 0


# ---------- Questions and history ----------

def test_questions_endpoint(client, make_headers):
    headers = make_headers(UserRole.student)
    phq9 = client.get("/api/assessments/questions/PHQ9", headers=headers).json()
    assert len(phq9["questions"]) == 9
    assert "last 2 weeks" in phq9["stem"]
    assert [o["value"] for o in phq9["options"]] == [0, 1, 2, 3]
    assert phq9["disclaimer"]
    assert len(client.get("/api/assessments/questions/GAD7", headers=headers).json()["questions"]) == 7


def test_history_is_newest_first_and_private(client, make_headers):
    alice, bob = make_headers(UserRole.student), make_headers(UserRole.student)
    client.post("/api/assessments", json={"type": "GAD7", "answers": [0] * 7}, headers=alice)
    client.post("/api/assessments", json={"type": "PHQ9", "answers": [1] * 8 + [0]}, headers=alice)

    history = client.get("/api/assessments/history", headers=alice).json()
    assert [r["type"] for r in history["results"]] == ["PHQ9", "GAD7"]
    assert history["disclaimer"]
    assert client.get("/api/assessments/history", headers=bob).json()["results"] == []
