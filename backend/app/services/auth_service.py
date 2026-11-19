"""Business logic for registering and logging in users."""
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import Appointment, AppointmentStatus, AvailabilitySlot, StudentProfile, User, UserRole
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


class WrongPassword(Exception):
    pass


def delete_student_account(db: Session, student: User, password: str) -> None:
    """Permanently delete a student and ALL their data (privacy: right to be forgotten).

    The database deletes their profile, check-ins and answers, assessments, chat messages,
    crisis alerts and appointments automatically (ON DELETE CASCADE on every foreign key).
    """
    # Ask for the password again: this cannot be undone
    if not verify_password(password, student.password_hash):
        raise WrongPassword()

    # Free the counsellors' slots booked by this student, or they would stay "booked" forever
    booked_slot_ids = select(Appointment.slot_id).where(
        Appointment.student_id == student.id,
        Appointment.status.in_([AppointmentStatus.requested, AppointmentStatus.confirmed]),
    )
    db.execute(update(AvailabilitySlot).where(AvailabilitySlot.id.in_(booked_slot_ids)).values(is_booked=False))

    db.execute(delete(User).where(User.id == student.id))  # cascades to all their rows
    db.commit()


# A real bcrypt hash of a random password, used when the email doesn't exist (see authenticate)
_DUMMY_HASH = hash_password("not-a-real-password-just-for-timing")


def authenticate(db: Session, email: str, password: str) -> User | None:
    """Returns the user if email + password are correct and the account is active, else None."""
    user = get_user_by_email(db, email)
    if user is None:
        # Still run bcrypt (~0.2 s) so an unknown email takes as long as a wrong password.
        # Otherwise response times would reveal which emails are registered.
        verify_password(password, _DUMMY_HASH)
        return None
    if not user.is_active or not verify_password(password, user.password_hash):
        return None
    return user
