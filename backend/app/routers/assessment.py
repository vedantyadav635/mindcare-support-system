"""Self-assessment endpoints (PHQ-9, GAD-7). Screening only, never a diagnosis."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models import AssessmentType, User, UserRole
from app.schemas.assessment import AssessmentHistoryOut, AssessmentIn, AssessmentResult, QuestionsOut
from app.services import assessment as service

router = APIRouter(prefix="/api/assessments", tags=["assessments"])

student_only = require_role(UserRole.student)


@router.get("/questions/{assessment_type}", response_model=QuestionsOut)
def get_questions(assessment_type: AssessmentType, _: User = Depends(get_current_user)):
    """Any logged-in user. The questions (standard wording), the 0-3 answer options and the disclaimer.
    `assessment_type` is `PHQ9` (9 questions) or `GAD7` (7 questions)."""
    return service.get_questions(assessment_type)


@router.post("", response_model=AssessmentResult)
def submit(data: AssessmentIn, db: Session = Depends(get_db), student: User = Depends(student_only)):
    """Students only. One answer (0-3) per question, in order. Returns the score, severity band,
    a supportive message and whether talking to a counsellor is suggested. **Not a diagnosis.**

    If PHQ-9 question 9 (thoughts of self-harm) is above 0, the response has `crisis: true` with
    helplines, and counsellors are alerted, whatever the total score.
    """
    return service.submit_assessment(db, student, data.type, data.answers)


@router.get("/history", response_model=AssessmentHistoryOut)
def history(db: Session = Depends(get_db), student: User = Depends(student_only)):
    """Students only. Your own results, newest first (scores and bands, not individual answers)."""
    return service.get_history(db, student)
