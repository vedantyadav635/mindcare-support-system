"""Wellness resources: listing (everyone) and management (admin)."""
import json
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Resource, ResourceType
from app.schemas.resource import ResourceIn

SEED_FILE = Path(__file__).resolve().parent.parent / "data" / "seed_resources.json"


class ResourceNotFound(Exception):
    pass


def list_resources(db: Session, resource_type: ResourceType | None = None, tag: str | None = None) -> list[Resource]:
    query = select(Resource).where(Resource.is_active).order_by(Resource.id)
    if resource_type:
        query = query.where(Resource.type == resource_type)
    if tag:
        # PostgreSQL: tags @> ARRAY[tag]  ("the tags array contains this tag")
        query = query.where(Resource.tags.contains([tag]))
    return list(db.scalars(query))


def _apply(resource: Resource, data: ResourceIn) -> None:
    resource.title = data.title
    resource.type = data.type
    resource.body = data.body
    resource.url = str(data.url) if data.url else None
    resource.tags = data.tags
    resource.is_active = data.is_active


def create_resource(db: Session, data: ResourceIn) -> Resource:
    resource = Resource()
    _apply(resource, data)
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


def update_resource(db: Session, resource_id: int, data: ResourceIn) -> Resource:
    resource = db.get(Resource, resource_id)
    if resource is None:
        raise ResourceNotFound()
    _apply(resource, data)
    db.commit()
    db.refresh(resource)
    return resource


def deactivate_resource(db: Session, resource_id: int) -> None:
    """Soft delete: hidden from students, but kept so it can be restored."""
    resource = db.get(Resource, resource_id)
    if resource is None:
        raise ResourceNotFound()
    resource.is_active = False
    db.commit()


def seed_default_resources(db: Session) -> int:
    """Load app/data/seed_resources.json only if the table is empty. Returns how many were added."""
    if db.scalar(select(func.count()).select_from(Resource)):
        return 0
    items = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    for item in items:
        create_resource(db, ResourceIn(**item))  # same validation as the admin API
    return len(items)
