"""FastAPI dependencies for authentication (who are you?) and authorization (are you allowed?)."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database import get_db
from app.models import User, UserRole

# Reads the "Authorization: Bearer <token>" header. auto_error=False lets us send our own 401.
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    payload = decode_token(credentials.credentials)
    if payload is None:
        raise unauthorized

    # Load the user fresh from the DB, so a deactivated user is locked out immediately
    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise unauthorized
    return user


def require_role(*roles: UserRole):
    """Usage: Depends(require_role(UserRole.admin)). Returns 403 if the user's role is not allowed."""

    def checker(user: User = Depends(get_current_user)) -> User:
        # The role comes from the database, not the token, so it is always current
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed for your role")
        return user

    return checker
