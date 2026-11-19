"""FastAPI entry point. Run with: uvicorn app.main:app --reload (from backend/)."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    account,
    admin,
    alerts,
    appointment,
    assessment,
    auth,
    chat,
    checkin,
    dashboard,
    recommendation,
    resource,
    wellbeing,
)
from app.services import nlp


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Runs once at startup: load the AI models (a few seconds) so requests don't wait for them
    nlp.load_models()
    yield


DESCRIPTION = """
Backend for the **Digital Mental Health and Psychological Support System for Students in Higher Education**.

This is an early-support and referral tool. **It does not diagnose.** Assessment and AI
responses always include a non-diagnostic disclaimer.

**How to try it here:** register or log in with `POST /api/auth/login`, copy the `access_token`,
click **Authorize** (top right) and paste it. Every endpoint except register, login and health
needs this token. Each endpoint says which role (student, counsellor, admin) may call it.
"""

TAGS = [
    {"name": "auth", "description": "Register a student, log in, see your own account."},
    {"name": "account", "description": "Delete your own account and all its data."},
    {"name": "check-in", "description": "Daily question-based check-in (students) and its questions (admins)."},
    {"name": "wellbeing", "description": "Mood, stress and sleep trends for charts."},
    {"name": "assessments", "description": "PHQ-9 / GAD-7 self-assessments. Screening aids, not diagnoses."},
    {"name": "chat", "description": "AI support chat. Every message is safety-checked before anything else."},
    {"name": "recommendations", "description": "Personalised wellness resources, each with a reason."},
    {"name": "resources", "description": "Wellness resources library (admins manage it)."},
    {"name": "appointments", "description": "Counsellor availability slots and appointment booking."},
    {"name": "alerts", "description": "Crisis alerts for counsellors (short excerpt only)."},
    {"name": "dashboard", "description": "One-call home-page data for students and counsellors."},
    {"name": "admin", "description": "User management and counts-only statistics."},
]

app = FastAPI(
    title="MindCare Student Support API",
    description=DESCRIPTION,
    version="1.0.0",
    openapi_tags=TAGS,
    lifespan=lifespan,
)

# Only the React frontend's own origin may call this API from a browser.
# We send the JWT in the Authorization header (no cookies), so credentials are not needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(account.router)
app.include_router(checkin.router)
app.include_router(wellbeing.router)
app.include_router(assessment.router)
app.include_router(chat.router)
app.include_router(recommendation.router)
app.include_router(resource.router)
app.include_router(appointment.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["auth"])
def health():
    """Public. Returns `{"status": "ok"}` when the server is running."""
    return {"status": "ok"}
