"""AI support chat: safety check first, then emotion/sentiment analysis and a template reply.

Privacy: message text is never logged.
"""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AlertSource, ChatMessage, ChatSender, Resource, RiskLevel, User
from app.schemas.chat import ChatHistoryOut, ChatReply
from app.schemas.resource import ResourceOut
from app.services import escalation, nlp, responder, safety

MAX_SUGGESTIONS = 2


def _suggest_resources(db: Session, tags: list[str]) -> list[Resource]:
    if not tags:
        return []
    return list(
        db.scalars(
            select(Resource)
            .where(Resource.is_active, Resource.tags.overlap(tags))  # shares at least one tag
            .order_by(func.random())  # a different pick each time
            .limit(MAX_SUGGESTIONS)
        )
    )


def send_message(db: Session, student: User, text: str) -> ChatReply:
    """Blocking (DB + model inference): the router runs it in a worker thread."""
    # 1. SAFETY FIRST, before anything else looks at the message
    safety_result = safety.check(text)

    if safety_result["risk_level"] == "high":
        # 2. Crisis: save, alert counsellors, and reply with help. The NLP models are NOT called.
        message = ChatMessage(student_id=student.id, sender=ChatSender.student, text=text, risk_level=RiskLevel.high)
        db.add(message)
        db.flush()  # gives message.id for the alert
        escalation.create_crisis_alert(
            db,
            student_id=student.id,
            source=AlertSource.chat,
            matched_rule=safety_result["matched_rule"],
            message_id=message.id,
            excerpt=text,
        )
        crisis = escalation.crisis_response()
        db.add(ChatMessage(student_id=student.id, sender=ChatSender.bot, text=crisis.message))
        db.commit()  # message, alert and reply are saved together
        return ChatReply(
            reply=crisis.message,
            emotion=None,
            sentiment=None,
            suggested_resources=[],
            crisis=True,
            crisis_response=crisis,
            disclaimer=responder.DISCLAIMER,
        )

    # 3. Normal message: analyse tone, save, reply from templates
    labels = nlp.analyse(text)
    db.add(
        ChatMessage(
            student_id=student.id,
            sender=ChatSender.student,
            text=text,
            sentiment=labels["sentiment"],
            emotion=labels["emotion"],
        )
    )
    reply, tags = responder.build_reply(labels["emotion"], labels["sentiment"])
    resources = _suggest_resources(db, tags)
    db.add(ChatMessage(student_id=student.id, sender=ChatSender.bot, text=reply))
    db.commit()
    return ChatReply(
        reply=reply,
        emotion=labels["emotion"],
        sentiment=labels["sentiment"],
        suggested_resources=[ResourceOut.model_validate(r) for r in resources],
        crisis=False,
        crisis_response=None,
        disclaimer=responder.DISCLAIMER,
    )


def get_history(db: Session, student: User, page: int, page_size: int) -> ChatHistoryOut:
    """The student's own conversation (both their messages and the bot's), newest first."""
    mine = ChatMessage.student_id == student.id
    total = db.scalar(select(func.count()).select_from(ChatMessage).where(mine))
    messages = db.scalars(
        select(ChatMessage)
        .where(mine)
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return ChatHistoryOut(items=list(messages), page=page, page_size=page_size, total=total)
