"""Business logic for registering and logging in users."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import StudentProfile, User, UserRole
from app.schemas.auth import RegisterIn


class EmailAlreadyRegistered(Exception):
    pass


def get_user_by_email(db: Session, email: str) -> User | None:
    # Emails are stored lowercase, so "A@x.com" and "a@x.com" are the same account
    return db.scalar(select(User).where(User.email == email.lower()))


def register_student(db: Session, data: RegisterIn) -> User:
    """Create a student user and their profile. The role is always student, never chosen by the client."""
    # ponytail: check-then-insert; two simultaneous sign-ups with one email hit the DB unique constraint (500), fine at this scale
    if get_user_by_email(db, data.email):
        raise EmailAlreadyRegistered()

    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.student,
    )
    db.add(user)
    db.flush()  # sends the INSERT so user.id is available for the profile

    db.add(
        StudentProfile(
            user_id=user.id,
            enrollment_no=data.enrollment_no,
            department=data.department,
            year=data.year,
            consent_given=data.consent_given,
        )
    )
    db.commit()  # user and profile are saved together, or not at all
    db.refresh(user)  # load server defaults (id, created_at, is_active)
    return user


def authenticate(db: Session, email: str, password: str) -> User | None:
    """Returns the user if email + password are correct and the account is active, else None."""
    user = get_user_by_email(db, email)
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        return None
    return user
