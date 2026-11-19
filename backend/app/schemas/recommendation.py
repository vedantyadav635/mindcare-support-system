"""Response shape for personalised resource recommendations."""
from pydantic import BaseModel

from app.schemas.resource import ResourceOut


class RecommendationOut(BaseModel):
    resource: ResourceOut
    score: float  # 0..1; 0 for default suggestions when there is not enough data
    why: str  # e.g. "Because your sleep averaged 5.2 hours this week"
