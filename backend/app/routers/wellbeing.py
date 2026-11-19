"""Wellbeing trend data for the student's charts."""
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models import User, UserRole
from app.services import wellbeing as service

router = APIRouter(prefix="/api/wellbeing", tags=["wellbeing"])


@router.get("/trends")
def trends(
    period: Literal["week", "month"] = "week",
    db: Session = Depends(get_db),
    student: User = Depends(require_role(UserRole.student)),
):
    """week: one point per day for the last 7 days. month: weekly averages for the last 30 days."""
    return service.get_trends(db, student.id, period)
