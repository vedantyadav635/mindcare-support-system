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
    return service.list_active_questions(db)


@router.post("/admin/checkin/questions", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def create_question(data: QuestionIn, db: Session = Depends(get_db), _: User = Depends(admin_only)):
    try:
        return service.create_question(db, data)
    except service.MetricAlreadyUsed as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.put("/admin/checkin/questions/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int, data: QuestionIn, db: Session = Depends(get_db), _: User = Depends(admin_only)
):
    try:
        return service.update_question(db, question_id, data)
    except service.QuestionNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    except service.MetricAlreadyUsed as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.delete("/admin/checkin/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int, db: Session = Depends(get_db), _: User = Depends(admin_only)):
    try:
        service.deactivate_question(db, question_id)
    except service.QuestionNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Daily check-in (the logged-in student's own data only) ----------

@router.post("/checkin", response_model=CheckinResult)
def submit_checkin(data: CheckinIn, db: Session = Depends(get_db), student: User = Depends(student_only)):
    try:
        return service.submit_checkin(db, student, data)
    except service.CheckinError as e:
        raise _unprocessable(e)


@router.get("/checkin/today", response_model=TodayOut)
def checkin_today(db: Session = Depends(get_db), student: User = Depends(student_only)):
    entry = service.get_today(db, student)
    return TodayOut(done=entry is not None, entry=entry)


@router.get("/checkin/history", response_model=list[EntryOut])
def checkin_history(
    date_from: date | None = Query(None, alias="from"),  # "from" is a Python keyword
    date_to: date | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
    student: User = Depends(student_only),
):
    try:
        return service.get_history(db, student, date_from, date_to)
    except service.CheckinError as e:
        raise _unprocessable(e)
