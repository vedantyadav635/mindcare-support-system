"""FastAPI entry point. Run with: uvicorn app.main:app --reload (from backend/)."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import alerts, appointment, assessment, auth, chat, checkin, resource, wellbeing
from app.services import nlp


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once at startup: load the AI models (a few seconds) so requests don't wait for them
    nlp.load_models()
    yield


app = FastAPI(title="MindCare Student Support API", lifespan=lifespan)

# Allow the React frontend (different port) to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(checkin.router)
app.include_router(wellbeing.router)
app.include_router(assessment.router)
app.include_router(resource.router)
app.include_router(appointment.router)
app.include_router(alerts.router)
app.include_router(chat.router)


@app.get("/api/health")
def health():
    """Simple check that the server is running."""
    return {"status": "ok"}
