"""Wellness resource endpoints. Anyone logged in can read; only admins can change."""
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.database import get_db
from app.models import ResourceType, User, UserRole
from app.schemas.resource import ResourceIn, ResourceOut, Tag
from app.services import resource as service

router = APIRouter(prefix="/api/resources", tags=["resources"])

admin_only = require_role(UserRole.admin)
NOT_FOUND = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")


@router.get("", response_model=list[ResourceOut])
def list_resources(
    type: ResourceType | None = None,
    tag: Tag | None = None,  # unknown tags get a 422
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Any logged-in user. Active resources, optionally filtered by `type` and/or `tag`."""
    return service.list_resources(db, type, tag)


@router.post("", response_model=ResourceOut, status_code=status.HTTP_201_CREATED)
def create_resource(data: ResourceIn, db: Session = Depends(get_db), _: User = Depends(admin_only)):
    """Admin only. Needs a body or a url. Tags must come from the allowed list."""
    return service.create_resource(db, data)


@router.put("/{resource_id}", response_model=ResourceOut)
def update_resource(resource_id: int, data: ResourceIn, db: Session = Depends(get_db), _: User = Depends(admin_only)):
    """Admin only. Replaces the whole resource. Set `is_active: true` to restore a deleted one."""
    try:
        return service.update_resource(db, resource_id, data)
    except service.ResourceNotFound:
        raise NOT_FOUND


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(resource_id: int, db: Session = Depends(get_db), _: User = Depends(admin_only)):
    """Admin only. Soft delete: hidden from students, kept so it can be restored."""
    try:
        service.deactivate_resource(db, resource_id)
    except service.ResourceNotFound:
        raise NOT_FOUND
    return Response(status_code=status.HTTP_204_NO_CONTENT)
