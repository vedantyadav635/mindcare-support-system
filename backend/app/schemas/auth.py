"""Request/response shapes for authentication. Pydantic validates every incoming field."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import UserRole


class RegisterIn(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [{
        "email": "asha@college.edu", "password": "secret123", "full_name": "Asha Patel",
        "enrollment_no": "EN2024001", "department": "Computer Science", "year": 2, "consent_given": True,
    }]})

    email: EmailStr
    # bcrypt only uses the first 72 bytes of a password, so we cap it there
    password: str = Field(min_length=8, max_length=72)
    full_name: str = Field(min_length=1, max_length=150)
    enrollment_no: str = Field(min_length=1, max_length=50)
    department: str = Field(min_length=1, max_length=100)
    year: int = Field(ge=1, le=6)
    consent_given: bool

    @field_validator("consent_given")
    @classmethod
    def consent_must_be_true(cls, value: bool) -> bool:
        if not value:
            raise ValueError("You must give consent to register")
        return value


class LoginIn(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [{"email": "asha@college.edu", "password": "secret123"}]})

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole


class UserOut(BaseModel):
    """What we send back about a user. Deliberately has no password_hash."""

    model_config = ConfigDict(from_attributes=True)  # allows building it from a SQLAlchemy object

    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
