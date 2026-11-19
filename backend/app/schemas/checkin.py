"""Request/response shapes for check-in questions and daily check-ins."""
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import AnswerType, CheckinMetric
from app.schemas.safety import CrisisResponseOut

# Allowed answer values for each metric (these match the CHECK constraints on wellbeing_entries)
METRIC_RANGES = {
    CheckinMetric.mood: (1, 5),
    CheckinMetric.stress: (1, 5),
    CheckinMetric.sleep: (0, 24),
}

DEFAULT_TEXT_MAX_LENGTH = 300


# ---------- Questions (admin manages them) ----------

class OptionIn(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    value: float


class QuestionIn(BaseModel):
    """Used for both create (POST) and full update (PUT)."""

    text: str = Field(min_length=1, max_length=300)
    answer_type: AnswerType
    options: list[OptionIn] | None = None
    metric: CheckinMetric = CheckinMetric.none
    is_required: bool = True
    max_length: int | None = Field(default=None, ge=1, le=2000)
    display_order: int = 0
    is_active: bool = True

    @model_validator(mode="after")
    def check_question_is_consistent(self):
        if self.answer_type == AnswerType.option:
            if not self.options or len(self.options) < 2:
                raise ValueError("An option question needs at least 2 options")
            values = [option.value for option in self.options]
            if len(set(values)) != len(values):
                raise ValueError("Option values must be unique")
            if self.max_length is not None:
                raise ValueError("max_length is only for text questions")
            if self.metric in METRIC_RANGES:
                low, high = METRIC_RANGES[self.metric]
                if any(not low <= v <= high for v in values):
                    raise ValueError(f"Values for metric '{self.metric.value}' must be between {low} and {high}")
                # mood and stress are stored as whole numbers
                if self.metric != CheckinMetric.sleep and any(v != int(v) for v in values):
                    raise ValueError(f"Values for metric '{self.metric.value}' must be whole numbers")
        else:  # text question
            if self.options:
                raise ValueError("A text question cannot have options")
            if self.metric != CheckinMetric.none:
                raise ValueError("Only option questions can have a metric")
            if self.max_length is None:
                self.max_length = DEFAULT_TEXT_MAX_LENGTH
        return self


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    answer_type: AnswerType
    options: list[OptionIn] | None
    metric: CheckinMetric
    is_required: bool
    max_length: int | None
    display_order: int
    is_active: bool


# ---------- Daily check-in (students) ----------

class AnswerIn(BaseModel):
    """Send option_value for an option question, or text_answer for a text question."""

    question_id: int
    option_value: float | None = None
    text_answer: str | None = None

    @model_validator(mode="after")
    def exactly_one_answer(self):
        if (self.option_value is None) == (self.text_answer is None):
            raise ValueError("Send exactly one of option_value or text_answer")
        return self


class CheckinIn(BaseModel):
    entry_date: date | None = None  # defaults to today
    answers: list[AnswerIn]


class CheckinResult(BaseModel):
    entry_id: int
    entry_date: date
    mood: int | None
    stress: int | None
    sleep_hours: float | None
    crisis: bool  # true if a text answer looked high-risk
    crisis_response: CrisisResponseOut | None  # helplines + urgent-booking flag, only when crisis


class AnswerOut(BaseModel):
    question_id: int
    question_text: str
    answer_type: AnswerType
    option_value: float | None
    option_label: str | None
    text_answer: str | None


class EntryOut(BaseModel):
    entry_id: int
    entry_date: date
    mood: int | None
    stress: int | None
    sleep_hours: float | None
    answers: list[AnswerOut]


class TodayOut(BaseModel):
    done: bool
    entry: EntryOut | None  # today's answers, so the form can be pre-filled for editing
