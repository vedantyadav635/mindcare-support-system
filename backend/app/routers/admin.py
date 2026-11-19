"""Admin-only endpoints: user management and aggregate statistics."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.admin import AdminStats, CounsellorCreatedOut, CounsellorIn, UserActiveIn, UserListOut
from app.schemas.auth import UserOut
from app.services import admin as service
from app.services.auth_service import EmailAlreadyRegistered

router = APIRouter(prefix="/api/admin", tags=["admin"])

admin_only = require_role(UserRole.admin)


@router.get("/users", response_model=UserListOut)
def list_users(
    role: UserRole | None = None,
    search: str | None = Query(None, max_length=100),  # matches name or email
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(admin_only),
):
    """Admin only. All users, optionally by `role` and a `search` on name or email, paginated."""
    return service.list_users(db, role, search, page, page_size)


@router.post("/counsellors", response_model=CounsellorCreatedOut, status_code=status.HTTP_201_CREATED)
def create_counsellor(data: CounsellorIn, db: Session = Depends(get_db), _: User = Depends(admin_only)):
    """Admin only. Creates a counsellor account and profile. The `temporary_password` is shown
    **only in this response**; pass it to the counsellor securely. 409 if the email exists."""
    try:
        user, temporary_password = service.create_counsellor(db, data)
    except EmailAlreadyRegistered:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    return CounsellorCreatedOut(user=user, temporary_password=temporary_password)


@router.patch("/users/{user_id}", response_model=UserOut)
def set_user_active(
    user_id: int, data: UserActiveIn, db: Session = Depends(get_db), admin: User = Depends(admin_only)
):
    """Admin only. Deactivated users can't log in, and their existing tokens stop working immediately.
    You can't deactivate yourself (409)."""
    try:
        return service.set_active(db, admin, user_id, data.is_active)
    except service.UserNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except service.CannotDeactivateSelf:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You cannot deactivate your own account")


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db), _: User = Depends(admin_only)):
    """Admin only. Counts only (no names, no private text). "This week" = the last 7 days."""
    return service.get_stats(db)
