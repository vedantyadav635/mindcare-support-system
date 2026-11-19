"""AI support chat endpoints (students only)."""
from fastapi import APIRouter, Depends, Query
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.core.deps import require_role
from app.database import get_db
from app.models import User, UserRole
from app.schemas.chat import ChatHistoryOut, ChatIn, ChatReply
from app.services import chat as service

router = APIRouter(prefix="/api/chat", tags=["chat"])

student_only = require_role(UserRole.student)


@router.post("/message", response_model=ChatReply)
async def send_message(data: ChatIn, db: Session = Depends(get_db), student: User = Depends(student_only)):
    """Students only. Send a message (max 1000 characters) and get a supportive reply.

    The message is **safety-checked first**. If it suggests a crisis, the reply is the crisis
    response (helplines, urgent-booking flag), counsellors are alerted, and the AI models are not
    used. Otherwise emotion and sentiment are detected and the reply may suggest 1-2 resources.
    """
    # Model inference takes a few hundred milliseconds of CPU. Running it in a worker thread keeps
    # the server free to answer other students in the meantime.
    return await run_in_threadpool(service.send_message, db, student, data.text)


@router.get("/history", response_model=ChatHistoryOut)
def history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    student: User = Depends(student_only),
):
    """Students only. Your own conversation (your messages and the bot's), newest first, paginated."""
    return service.get_history(db, student, page, page_size)
