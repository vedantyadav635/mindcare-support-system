"""Personalised resource recommendations for the logged-in student."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.recommendation import RecommendationOut
from app.schemas.resource import ResourceOut
from app.services import recommender

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("", response_model=list[RecommendationOut])
def get_recommendations(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    student: User = Depends(require_role(UserRole.student)),
):
    """Students only. Resources ranked from your last 7 days (mood, stress, sleep, chat emotions),
    each with a score 0-1 and a `why`. A counsellor session comes first after a moderate-or-worse
    assessment in the last 14 days or an open crisis alert. No data yet gives a default list."""
    return [
        RecommendationOut(resource=ResourceOut.model_validate(rec.resource), score=rec.score, why=rec.why)
        for rec in recommender.recommend(db, student.id, limit)
    ]
