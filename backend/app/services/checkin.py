"""Check-in questions (admin) and daily check-ins (students).

Privacy: text answers are never logged or put into error messages.
"""
import json
from datetime import date
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    AnswerType,
    CheckinAnswer,
    CheckinMetric,
    CheckinQuestion,
    RiskLevel,
    User,
    WellbeingEntry,
)
from app.schemas.checkin import AnswerOut, CheckinIn, CheckinResult, EntryOut, QuestionIn

SEED_FILE = Path(__file__).resolve().parent.parent / "data" / "seed_checkin_questions.json"


class CheckinError(ValueError):
    """Invalid check-in or question (the router turns this into HTTP 422)."""


class QuestionNotFound(Exception):
    pass


class MetricAlreadyUsed(Exception):
    """Another active question already fills this metric (HTTP 409)."""


# ---------- Safety ----------

def screen_text(text: str) -> dict:
    """Check a text answer for crisis risk.

    TODO(Step 7): replace this placeholder with safety.check(text), which returns
    {"risk_level": "high"} for crisis language. Step 7 also creates the crisis alert
    (source="checkin") and returns helpline content to the student.
    """
    return {"risk_level": "none"}


# ---------- Questions ----------

def list_active_questions(db: Session) -> list[CheckinQuestion]:
    return list(
        db.scalars(
            select(CheckinQuestion)
            .where(CheckinQuestion.is_active)
            .order_by(CheckinQuestion.display_order, CheckinQuestion.id)
        )
    )


def _check_metric_free(db: Session, data: QuestionIn, exclude_id: int | None = None) -> None:
    """At most one ACTIVE question may fill each metric (mood, stress, sleep)."""
    if data.metric == CheckinMetric.none or not data.is_active:
        return
    query = select(CheckinQuestion.id).where(
        CheckinQuestion.metric == data.metric, CheckinQuestion.is_active
    )
    if exclude_id is not None:
        query = query.where(CheckinQuestion.id != exclude_id)
    if db.scalar(query) is not None:
        raise MetricAlreadyUsed(f"Another active question already uses metric '{data.metric.value}'")


def _apply(question: CheckinQuestion, data: QuestionIn) -> None:
    """Copy validated fields onto the database object."""
    question.text = data.text
    question.answer_type = data.answer_type
    question.options = [o.model_dump() for o in data.options] if data.options else None
    question.metric = data.metric
    question.is_required = data.is_required
    question.max_length = data.max_length
    question.display_order = data.display_order
    question.is_active = data.is_active


def create_question(db: Session, data: QuestionIn) -> CheckinQuestion:
    _check_metric_free(db, data)
    question = CheckinQuestion()
    _apply(question, data)
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def update_question(db: Session, question_id: int, data: QuestionIn) -> CheckinQuestion:
    question = db.get(CheckinQuestion, question_id)
    if question is None:
        raise QuestionNotFound()
    _check_metric_free(db, data, exclude_id=question_id)
    _apply(question, data)  # old answers keep their own copy of option_label
    db.commit()
    db.refresh(question)
    return question


def deactivate_question(db: Session, question_id: int) -> None:
    """Soft delete: old answers still point to this question, so the row stays."""
    question = db.get(CheckinQuestion, question_id)
    if question is None:
        raise QuestionNotFound()
    question.is_active = False
    db.commit()


def seed_default_questions(db: Session) -> int:
    """Load the default questions from the JSON file, only if the table is empty. Returns how many were added."""
    if db.scalar(select(func.count()).select_from(CheckinQuestion)):
        return 0
    items = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    for item in items:
        create_question(db, QuestionIn(**item))  # same validation as the admin API
    return len(items)


# ---------- Daily check-in ----------

def submit_checkin(db: Session, student: User, data: CheckinIn) -> CheckinResult:
    """Validate the answers and save (or replace) the student's check-in for that day."""
    # ponytail: "today" is the server's local date; store a per-user timezone if students span timezones
    today = date.today()
    entry_date = data.entry_date or today
    if entry_date > today:
        raise CheckinError("Check-in date cannot be in the future")

    questions = {q.id: q for q in list_active_questions(db)}
    new_answers: list[CheckinAnswer] = []
    answered_ids: set[int] = set()
    seen_ids: set[int] = set()
    metric_values: dict[CheckinMetric, float] = {}
    crisis = False

    for answer in data.answers:
        if answer.question_id in seen_ids:
            raise CheckinError(f"Question {answer.question_id} is answered more than once")
        seen_ids.add(answer.question_id)

        question = questions.get(answer.question_id)
        if question is None:
            raise CheckinError(f"Question {answer.question_id} does not exist or is not active")

        if question.answer_type == AnswerType.option:
            if answer.option_value is None:
                raise CheckinError(f"Question {question.id} needs an option_value")
            label = next((o["label"] for o in question.options if o["value"] == answer.option_value), None)
            if label is None:
                raise CheckinError(f"Invalid option for question {question.id}")
            new_answers.append(
                CheckinAnswer(question=question, option_value=answer.option_value, option_label=label)
            )
            if question.metric != CheckinMetric.none:
                metric_values[question.metric] = answer.option_value
        else:
            if answer.text_answer is None:
                raise CheckinError(f"Question {question.id} needs a text_answer")
            text = answer.text_answer.strip()
            if len(text) > question.max_length:
                raise CheckinError(f"Answer to question {question.id} is longer than {question.max_length} characters")
            if not text:
                continue  # a blank answer counts as not answered
            risk = RiskLevel(screen_text(text)["risk_level"])
            crisis = crisis or risk == RiskLevel.high
            new_answers.append(CheckinAnswer(question=question, text_answer=text, risk_level=risk))

        answered_ids.add(question.id)

    missing = sorted(q.id for q in questions.values() if q.is_required and q.id not in answered_ids)
    if missing:
        raise CheckinError(f"Please answer the required questions: {missing}")

    # Upsert: one entry per student per day
    # ponytail: two simultaneous submits for the same day can hit the unique constraint (500); fine for one student
    entry = db.scalar(
        select(WellbeingEntry).where(
            WellbeingEntry.student_id == student.id, WellbeingEntry.entry_date == entry_date
        )
    )
    if entry is None:
        entry = WellbeingEntry(student_id=student.id, entry_date=entry_date)
        db.add(entry)
    else:
        entry.answers.clear()
        db.flush()  # delete the old answers first, or the new ones clash with the unique (entry, question)
    entry.answers.extend(new_answers)

    # Copy the metric answers into the score columns used by the trend charts
    mood = metric_values.get(CheckinMetric.mood)
    stress = metric_values.get(CheckinMetric.stress)
    entry.mood = int(mood) if mood is not None else None
    entry.stress = int(stress) if stress is not None else None
    entry.sleep_hours = metric_values.get(CheckinMetric.sleep)

    db.commit()
    return CheckinResult(
        entry_id=entry.id,
        entry_date=entry.entry_date,
        mood=entry.mood,
        stress=entry.stress,
        sleep_hours=entry.sleep_hours,
        crisis=crisis,
    )


def _entry_out(entry: WellbeingEntry) -> EntryOut:
    answers = sorted(entry.answers, key=lambda a: (a.question.display_order, a.question.id))
    return EntryOut(
        entry_id=entry.id,
        entry_date=entry.entry_date,
        mood=entry.mood,
        stress=entry.stress,
        sleep_hours=entry.sleep_hours,
        answers=[
            AnswerOut(
                question_id=a.question.id,
                question_text=a.question.text,
                answer_type=a.question.answer_type,
                option_value=a.option_value,
                option_label=a.option_label,
                text_answer=a.text_answer,
            )
            for a in answers
        ],
    )


def _entries_query(student_id: int):
    """Only this student's entries, with answers and their questions loaded in two extra queries."""
    return (
        select(WellbeingEntry)
        .where(WellbeingEntry.student_id == student_id)
        .options(selectinload(WellbeingEntry.answers).selectinload(CheckinAnswer.question))
    )


def get_today(db: Session, student: User) -> EntryOut | None:
    entry = db.scalar(_entries_query(student.id).where(WellbeingEntry.entry_date == date.today()))
    return _entry_out(entry) if entry else None


def get_history(db: Session, student: User, date_from: date | None, date_to: date | None) -> list[EntryOut]:
    if date_from and date_to and date_from > date_to:
        raise CheckinError("'from' must be on or before 'to'")
    query = _entries_query(student.id).order_by(WellbeingEntry.entry_date)
    if date_from:
        query = query.where(WellbeingEntry.entry_date >= date_from)
    if date_to:
        query = query.where(WellbeingEntry.entry_date <= date_to)
    return [_entry_out(entry) for entry in db.scalars(query)]
