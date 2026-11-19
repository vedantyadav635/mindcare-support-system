"""The logged-in user's own account."""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models import User, UserRole
from app.services import auth_service

router = APIRouter(prefix="/api", tags=["account"])


class DeleteAccountIn(BaseModel):
    model_config = ConfigDict(json_schema_extra={"examples": [{"password": "secret123"}]})

    password: str  # confirm with the password, because deletion is permanent


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    data: DeleteAccountIn, db: Session = Depends(get_db), student: User = Depends(require_role(UserRole.student))
):
    """Students only. **Permanently** deletes your account and all your data (check-ins, assessments,
    chat, appointments, alerts). Confirm with your password. Booked counsellor slots are freed."""
    try:
        auth_service.delete_student_account(db, student, data.password)
    except auth_service.WrongPassword:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Password is incorrect")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
