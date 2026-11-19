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
    return service.get_history(db, student, page, page_size)
