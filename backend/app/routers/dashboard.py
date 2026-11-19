"""Home-page data for students and counsellors, one request each."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.dashboard import CounsellorDashboard, StudentDashboard
from app.services import dashboard as service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/student", response_model=StudentDashboard)
def student_dashboard(db: Session = Depends(get_db), student: User = Depends(require_role(UserRole.student))):
    """Students only. Today's check-in status, 7-day mini trend, top 3 recommendations, next appointment."""
    return service.student_dashboard(db, student)


@router.get("/counsellor", response_model=CounsellorDashboard)
def counsellor_dashboard(db: Session = Depends(get_db), counsellor: User = Depends(require_role(UserRole.counsellor))):
    """Counsellors only. Open crisis alerts count, your appointments today, and pending requests."""
    return service.counsellor_dashboard(db, counsellor)
