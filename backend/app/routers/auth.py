"""Auth endpoints. Thin: they validate input, call the service, and shape the response."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.rate_limit import email_limiter, ip_limiter
from app.core.security import create_access_token
from app.database import get_db
from app.models import User
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    """Create a **student** account (counsellors are created by an admin; admins by a script).

    Consent must be `true`. Returns 409 if the email is already registered.
    """
    try:
        return auth_service.register_student(db, data)
    except auth_service.EmailAlreadyRegistered:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, request: Request, db: Session = Depends(get_db)):
    """Log in and get a JWT. Send it on every other request as `Authorization: Bearer <token>`.

    Wrong email and wrong password give the same 401. After 5 failed attempts for one email
    (or 20 from one IP address) within 15 minutes, login is blocked with 429 for a while.
    """
    # ponytail: behind a reverse proxy request.client.host is the proxy; read X-Forwarded-For there
    keys = {email_limiter: f"email:{data.email.lower()}", ip_limiter: f"ip:{request.client.host}"}
    wait = max(limiter.retry_after(key) for limiter, key in keys.items())
    if wait:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please try again in {wait // 60 + 1} minutes.",
            headers={"Retry-After": str(wait)},
        )

    user = auth_service.authenticate(db, data.email, data.password)
    if user is None:
        for limiter, key in keys.items():
            limiter.record_failure(key)
        # Same message for wrong email and wrong password, so attackers can't discover which emails exist
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    email_limiter.reset(keys[email_limiter])  # a successful login clears that account's failures
    token = create_access_token(user.id, user.role.value)
    return TokenOut(access_token=token, role=user.role)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    """The logged-in user's own account (never includes the password hash)."""
    return user
