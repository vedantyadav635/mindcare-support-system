"""Request/response shapes for wellness resources."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

from app.models import ResourceType

# The only tags a resource may have (also used to match resources to a student's mood / chat emotion)
Tag = Literal[
    "low_mood", "stress", "anxiety", "sleep", "anger", "fear", "sadness", "loneliness", "academic", "crisis"
]


class ResourceIn(BaseModel):
    """Used for both create (POST) and full update (PUT)."""

    model_config = ConfigDict(json_schema_extra={"examples": [{
        "title": "Two-minute stretch break", "type": "activity", "tags": ["stress", "academic"],
        "body": "Stand up, roll your shoulders back five times, stretch your arms above your head and take three slow breaths.",
    }]})

    title: str = Field(min_length=1, max_length=200)
    type: ResourceType
    body: str | None = Field(default=None, max_length=3000)
    url: HttpUrl | None = None
    tags: list[Tag] = []
    is_active: bool = True

    @field_validator("tags")
    @classmethod
    def remove_duplicate_tags(cls, tags: list[str]) -> list[str]:
        return list(dict.fromkeys(tags))  # keeps the original order

    @model_validator(mode="after")
    def needs_content(self):
        if not self.body and not self.url:
            raise ValueError("A resource needs a body or a url")
        return self


class ResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    type: ResourceType
    body: str | None
    url: str | None
    tags: list[str]
    is_active: bool
