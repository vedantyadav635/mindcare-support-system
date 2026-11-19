"""Admin: manage users and see aggregate statistics."""
import secrets
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import (
    AlertStatus,
    Appointment,
    AppointmentStatus,
    Assessment,
    CounsellorProfile,
    CrisisAlert,
    User,
    UserRole,
    WellbeingEntry,
)
from app.schemas.admin import AdminStats, CounsellorIn, UserListOut
from app.services.auth_service import EmailAlreadyRegistered, get_user_by_email


class UserNotFound(Exception):
    pass


class CannotDeactivateSelf(Exception):
    pass


def list_users(db: Session, role: UserRole | None, search: str | None, page: int, page_size: int) -> UserListOut:
    query = select(User)
    if role:
        query = query.where(User.role == role)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(or_(User.full_name.ilike(pattern), User.email.ilike(pattern)))  # case-insensitive

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    users = db.scalars(query.order_by(User.id).offset((page - 1) * page_size).limit(page_size))
    return UserListOut(items=list(users), page=page, page_size=page_size, total=total)


def create_counsellor(db: Session, data: CounsellorIn) -> tuple[User, str]:
    """Returns (user, temporary password). The password is stored only as a bcrypt hash."""
    if get_user_by_email(db, data.email):
        raise EmailAlreadyRegistered()
    temporary_password = secrets.token_urlsafe(9)  # 12 random URL-safe characters

    user = User(
        email=data.email.lower(),
        password_hash=hash_password(temporary_password),
        full_name=data.full_name,
        role=UserRole.counsellor,
    )
    db.add(user)
    db.flush()  # gives user.id for the profile
    db.add(
        CounsellorProfile(
            user_id=user.id,
            qualification=data.qualification,
            specialization=data.specialization,
            phone=data.phone,
        )
    )
    db.commit()
    db.refresh(user)
    return user, temporary_password


def set_active(db: Session, admin: User, user_id: int, is_active: bool) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise UserNotFound()
    if user.id == admin.id and not is_active:
        raise CannotDeactivateSelf()  # would lock the admin out
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def get_stats(db: Session) -> AdminStats:
    week_start_date = date.today() - timedelta(days=6)  # last 7 days, including today
    week_start_time = datetime.now(timezone.utc) - timedelta(days=7)

    def count(model, *conditions) -> int:
        return db.scalar(select(func.count()).select_from(model).where(*conditions))

    by_status = dict(db.execute(select(Appointment.status, func.count()).group_by(Appointment.status)).all())
    return AdminStats(
        students=count(User, User.role == UserRole.student),
        counsellors=count(User, User.role == UserRole.counsellor),
        wellbeing_entries_this_week=count(WellbeingEntry, WellbeingEntry.entry_date >= week_start_date),
        assessments_this_week=count(Assessment, Assessment.created_at >= week_start_time),
        # Every status is listed, with 0 when there are none
        appointments_by_status={s.value: by_status.get(s, 0) for s in AppointmentStatus},
        open_alerts=count(CrisisAlert, CrisisAlert.status == AlertStatus.open),
    )
