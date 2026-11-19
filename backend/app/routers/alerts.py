"""Crisis alerts for counsellors."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models import AlertStatus, User, UserRole
from app.schemas.safety import AlertOut, AlertUpdate
from app.services import escalation as service

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

counsellor_only = require_role(UserRole.counsellor)


@router.get("", response_model=list[AlertOut])
def list_alerts(
    status: AlertStatus | None = None,  # e.g. ?status=open; omit for all
    db: Session = Depends(get_db),
    _: User = Depends(counsellor_only),
):
    """Counsellors only. Crisis alerts, newest first, with the student's name, why it was flagged
    (`reason`) and a short excerpt only, never the full text. Filter with `?status=open`."""
    return service.list_alerts(db, status)


@router.patch("/{alert_id}", response_model=AlertOut)
def update_alert(
    alert_id: int, data: AlertUpdate, db: Session = Depends(get_db), counsellor: User = Depends(counsellor_only)
):
    """Counsellors only. Set the status (open / seen / closed); records you as `handled_by`."""
    try:
        return service.update_alert_status(db, counsellor, alert_id, data.status)
    except service.AlertNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
