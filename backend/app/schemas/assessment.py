"""Request/response shapes for PHQ-9 / GAD-7 self-assessments."""
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import AssessmentType
from app.schemas.safety import CrisisResponseOut
from app.services.assessment import QUESTIONS

# Each answer is 0 (Not at all) .. 3 (Nearly every day)
AnswerValue = Annotated[int, Field(ge=0, le=3)]


class AssessmentIn(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [
        {"type": "GAD7", "answers": [1, 2, 1, 0, 1, 2, 0]},
        {"type": "PHQ9", "answers": [1, 1, 2, 1, 0, 1, 1, 0, 0]},
    ]})

    type: AssessmentType
    answers: list[AnswerValue]

    @model_validator(mode="after")
    def one_answer_per_question(self):
        expected = len(QUESTIONS[self.type])
        if len(self.answers) != expected:
            raise ValueError(f"{self.type.value} needs exactly {expected} answers")
        return self


class QuestionItem(BaseModel):
    number: int
    text: str


class OptionItem(BaseModel):
    value: int
    label: str


class QuestionsOut(BaseModel):
    type: AssessmentType
    stem: str
    questions: list[QuestionItem]
    options: list[OptionItem]
    disclaimer: str


class AssessmentResult(BaseModel):
    id: int
    type: AssessmentType
    total_score: int
    severity_band: str
    message: str
    suggest_counsellor: bool
    crisis: bool
    crisis_response: CrisisResponseOut | None  # only when crisis is true
    disclaimer: str


class AssessmentHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: AssessmentType
    total_score: int
    severity_band: str
    created_at: datetime


class AssessmentHistoryOut(BaseModel):
    results: list[AssessmentHistoryItem]  # newest first
    disclaimer: str
