"""Users and their role-specific profiles."""
import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, IdTimestampMixin


class UserRole(str, enum.Enum):
    student = "student"
    counsellor = "counsellor"
    admin = "admin"


class User(IdTimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))  # bcrypt hash, never the plain password
    full_name: Mapped[str] = mapped_column(String(150))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")


class StudentProfile(IdTimestampMixin, Base):
    __tablename__ = "student_profiles"

    # unique=True -> one profile per user (one-to-one)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    enrollment_no: Mapped[str] = mapped_column(String(50))
    department: Mapped[str] = mapped_column(String(100))
    year: Mapped[int] = mapped_column(Integer)
    consent_given: Mapped[bool] = mapped_column(Boolean, server_default="false")


class CounsellorProfile(IdTimestampMixin, Base):
    __tablename__ = "counsellor_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    qualification: Mapped[str] = mapped_column(String(150))
    specialization: Mapped[str] = mapped_column(String(150))
    phone: Mapped[str] = mapped_column(String(20))
