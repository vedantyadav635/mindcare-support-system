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
    """assessment_type is PHQ9 or GAD7 (anything else gets a 422)."""
    return service.get_questions(assessment_type)


@router.post("", response_model=AssessmentResult)
def submit(data: AssessmentIn, db: Session = Depends(get_db), student: User = Depends(student_only)):
    return service.submit_assessment(db, student, data.type, data.answers)


@router.get("/history", response_model=AssessmentHistoryOut)
def history(db: Session = Depends(get_db), student: User = Depends(student_only)):
    return service.get_history(db, student)
