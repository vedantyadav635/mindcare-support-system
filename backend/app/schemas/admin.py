"""Request/response shapes for admin endpoints."""
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.auth import UserOut


class UserListOut(BaseModel):
    items: list[UserOut]
    page: int
    page_size: int
    total: int


class CounsellorIn(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [{
        "email": "dr.rao@college.edu", "full_name": "Dr. Meera Rao", "qualification": "M.Phil Clinical Psychology",
        "specialization": "Anxiety and stress", "phone": "+91-98765-43210",
    }]})

    email: EmailStr
    full_name: str = Field(min_length=1, max_length=150)
    qualification: str = Field(min_length=1, max_length=150)
    specialization: str = Field(min_length=1, max_length=150)
    phone: str = Field(min_length=5, max_length=20)


class CounsellorCreatedOut(BaseModel):
    user: UserOut
    temporary_password: str  # shown ONCE; the admin passes it on to the counsellor


class UserActiveIn(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [{"is_active": False}]})

    is_active: bool


class AdminStats(BaseModel):
    """Counts only: no names, no private text."""

    students: int
    counsellors: int
    wellbeing_entries_this_week: int
    assessments_this_week: int
    appointments_by_status: dict[str, int]
    open_alerts: int
