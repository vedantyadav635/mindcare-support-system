"""Self-assessment questionnaires (PHQ-9, GAD-7). Screening only, not diagnosis."""
import enum

from sqlalchemy import JSON, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, IdTimestampMixin


class AssessmentType(str, enum.Enum):
    PHQ9 = "PHQ9"  # depression screening
    GAD7 = "GAD7"  # anxiety screening


class Assessment(IdTimestampMixin, Base):
    __tablename__ = "assessments"

    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[AssessmentType] = mapped_column(Enum(AssessmentType, name="assessment_type"))
    answers: Mapped[list] = mapped_column(JSON)  # list of item scores, e.g. [0, 1, 3, ...]
    total_score: Mapped[int] = mapped_column(Integer)
    severity_band: Mapped[str] = mapped_column(String(30))  # e.g. "mild", "moderate"
