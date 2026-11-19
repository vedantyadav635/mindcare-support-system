from unittest.mock import patch

import pytest

from app.models import AlertSource, ChatMessage, ChatSender, CrisisAlert, RiskLevel, UserRole
from app.services import chat as chat_service
from app.services import responder
from app.services.resource import seed_default_resources


def send(client, headers, text):
    return client.post("/api/chat/message", json={"text": text}, headers=headers)


def test_normal_message_gets_reply_and_both_messages_are_saved(client, db, make_headers):
    response = send(client, make_headers(UserRole.student), "Today was an ordinary day")
    assert response.status_code == 200
    body = response.json()
    # NLP_ENABLED=false -> the fake neutral result
    assert body["emotion"] == "neutral" and body["sentiment"] == "neutral"
    assert body["reply"] in responder.REPLIES["neutral"]
    assert body["crisis"] is False and body["crisis_response"] is None
    assert "not a therapist" in body["disclaimer"]

    student_msg, bot_msg = db.query(ChatMessage).order_by(ChatMessage.id).all()
    assert (student_msg.sender, student_msg.emotion, student_msg.risk_level) == (ChatSender.student, "neutral", RiskLevel.none)
    assert (bot_msg.sender, bot_msg.text) == (ChatSender.bot, body["reply"])


def test_risky_message_never_reaches_nlp(client, db, make_headers):
    """The safety check runs first; a crisis message must not be sent to the models."""
    with patch.object(chat_service.nlp, "analyse") as fake_analyse:
        response = send(client, make_headers(UserRole.student), "I want to kill myself")
    fake_analyse.assert_not_called()

    body = response.json()
    assert body["crisis"] is True
    assert body["emotion"] is None and body["sentiment"] is None
    assert any("14416" in h["contact"] for h in body["crisis_response"]["helplines"])
    assert body["crisis_response"]["show_urgent_booking"] is True
    assert body["disclaimer"]

    student_msg = db.query(ChatMessage).filter_by(sender=ChatSender.student).one()
    assert student_msg.risk_level == RiskLevel.high
    assert student_msg.emotion is None  # never analysed
    alert = db.query(CrisisAlert).one()
    assert (alert.source, alert.message_id, alert.matched_rule) == (AlertSource.chat, student_msg.id, "kill_myself")


def test_normal_message_does_reach_nlp(client, make_headers):
    """Proves the mock in the previous test really is wired to the code path."""
    fake = {"sentiment": "negative", "sentiment_score": 0.9, "emotion": "sadness", "emotion_score": 0.8}
    with patch.object(chat_service.nlp, "analyse", return_value=fake) as fake_analyse:
        body = send(client, make_headers(UserRole.student), "I feel low today").json()
    fake_analyse.assert_called_once_with("I feel low today")
    assert body["emotion"] == "sadness" and body["sentiment"] == "negative"
    assert body["reply"] in responder.REPLIES["sadness"]


def test_sad_message_suggests_matching_resources(client, db, make_headers):
    seed_default_resources(db)
    fake = {"sentiment": "negative", "sentiment_score": 0.9, "emotion": "sadness", "emotion_score": 0.8}
    with patch.object(chat_service.nlp, "analyse", return_value=fake):
        body = send(client, make_headers(UserRole.student), "I miss home").json()
    suggestions = body["suggested_resources"]
    assert 1 <= len(suggestions) <= 2
    for resource in suggestions:
        assert set(resource["tags"]) & set(responder.RESOURCE_TAGS["sadness"])
        assert "crisis" not in resource["tags"]


@pytest.mark.parametrize(
    "emotion, sentiment, key",
    [("sadness", "negative", "sadness"), ("neutral", "negative", "neutral_negative"),
     ("neutral", "positive", "neutral_positive"), ("neutral", "neutral", "neutral"), ("unknown", "neutral", "neutral")],
)
def test_reply_is_chosen_by_emotion_then_sentiment(emotion, sentiment, key):
    reply, tags = responder.build_reply(emotion, sentiment)
    assert reply in responder.REPLIES[key]
    assert tags == responder.RESOURCE_TAGS[key]


def test_every_mood_has_2_to_3_replies():
    assert all(2 <= len(variants) <= 3 for variants in responder.REPLIES.values())
    assert set(responder.REPLIES) == set(responder.RESOURCE_TAGS)


@pytest.mark.parametrize("text", ["", "   ", "x" * 1001])
def test_invalid_message_is_rejected(client, make_headers, text):
    assert send(client, make_headers(UserRole.student), text).status_code == 422


def test_only_students_can_chat(client, make_headers):
    for role in (UserRole.counsellor, UserRole.admin):
        headers = make_headers(role)
        assert send(client, headers, "hello").status_code == 403
        assert client.get("/api/chat/history", headers=headers).status_code == 403


def test_history_is_own_paginated_newest_first(client, make_headers):
    alice, bob = make_headers(UserRole.student), make_headers(UserRole.student)
    for i in range(3):
        send(client, alice, f"message {i}")  # 3 student + 3 bot messages

    page1 = client.get("/api/chat/history?page=1&page_size=4", headers=alice).json()
    assert page1["total"] == 6 and len(page1["items"]) == 4
    assert page1["items"][0]["sender"] == "bot"  # newest: the reply to "message 2"
    assert page1["items"][1]["text"] == "message 2"
    page2 = client.get("/api/chat/history?page=2&page_size=4", headers=alice).json()
    assert len(page2["items"]) == 2 and page2["items"][-1]["text"] == "message 0"

    assert client.get("/api/chat/history", headers=bob).json()["total"] == 0
    assert "risk_level" not in page1["items"][0]
