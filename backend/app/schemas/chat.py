"""Request/response shapes for the AI support chat."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import ChatSender
from app.schemas.resource import ResourceOut
from app.schemas.safety import CrisisResponseOut


class ChatIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)

    @field_validator("text")
    @classmethod
    def not_blank(cls, text: str) -> str:
        text = text.strip()
        if not text:
            raise ValueError("Message cannot be empty")
        return text


class ChatReply(BaseModel):
    reply: str
    emotion: str | None  # None when the safety layer stopped the message before analysis
    sentiment: str | None
    suggested_resources: list[ResourceOut]
    crisis: bool
    crisis_response: CrisisResponseOut | None  # helplines + urgent-booking flag, only when crisis
    disclaimer: str


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender: ChatSender
    text: str
    emotion: str | None
    sentiment: str | None
    created_at: datetime


class ChatHistoryOut(BaseModel):
    items: list[ChatMessageOut]  # newest first
    page: int
    page_size: int
    total: int
