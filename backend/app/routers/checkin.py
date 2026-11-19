"""Check-in endpoints: questions (read: everyone, manage: admin) and daily check-ins (students)."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.checkin import CheckinIn, CheckinResult, EntryOut, QuestionIn, QuestionOut, TodayOut
from app.services import checkin as service

router = APIRouter(prefix="/api", tags=["check-in"])

admin_only = require_role(UserRole.admin)
student_only = require_role(UserRole.student)


def _unprocessable(error: Exception) -> HTTPException:
    return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error))


# ---------- Questions ----------

@router.get("/checkin/questions", response_model=list[QuestionOut])
def list_questions(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Any logged-in user. The active check-in questions, in display order (the check-in form)."""
    return service.list_active_questions(db)


@router.post("/admin/checkin/questions", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def create_question(data: QuestionIn, db: Session = Depends(get_db), _: User = Depends(admin_only)):
    """Admin only. Option questions need 2+ options with numeric values; text questions have none.

    `metric` (mood / stress / sleep) copies the answer into the trend charts. Only one active
    question per metric (409 otherwise), and its values must fit the metric's range.
    """
    try:
        return service.create_question(db, data)
    except service.MetricAlreadyUsed as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.put("/admin/checkin/questions/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int, data: QuestionIn, db: Session = Depends(get_db), _: User = Depends(admin_only)
):
    """Admin only. Replaces the whole question (same rules as create). Old answers keep their labels."""
    try:
        return service.update_question(db, question_id, data)
    except service.QuestionNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    except service.MetricAlreadyUsed as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/admin/checkin/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int, db: Session = Depends(get_db), _: User = Depends(admin_only)):
    """Admin only. Soft delete: the question is hidden but kept, so old answers still make sense."""
    try:
        service.deactivate_question(db, question_id)
    except service.QuestionNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Daily check-in (the logged-in student's own data only) ----------

@router.post("/checkin", response_model=CheckinResult)
def submit_checkin(data: CheckinIn, db: Session = Depends(get_db), student: User = Depends(student_only)):
    """Students only. Save today's (or a past day's) check-in; submitting again replaces it.

    Send `option_value` for option questions and `text_answer` for text questions. All required
    questions must be answered. Every text answer is safety-checked: if it suggests a crisis, the
    response has `crisis: true` and `crisis_response` with helplines, and counsellors are alerted.
    """
    try:
        return service.submit_checkin(db, student, data)
    except service.CheckinError as e:
        raise _unprocessable(e)


@router.get("/checkin/today", response_model=TodayOut)
def checkin_today(db: Session = Depends(get_db), student: User = Depends(student_only)):
    """Students only. Whether today's check-in is done, and its answers (to pre-fill the form)."""
    entry = service.get_today(db, student)
    return TodayOut(done=entry is not None, entry=entry)


@router.get("/checkin/history", response_model=list[EntryOut])
def checkin_history(
    date_from: date | None = Query(None, alias="from"),  # "from" is a Python keyword
    date_to: date | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
    student: User = Depends(student_only),
):
    """Students only. Your own check-ins with questions and answers, oldest first.
    Optional `from` / `to` dates (YYYY-MM-DD)."""
    try:
        return service.get_history(db, student, date_from, date_to)
    except service.CheckinError as e:
        raise _unprocessable(e)
