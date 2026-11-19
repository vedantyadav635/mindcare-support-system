"""FastAPI entry point. Run with: uvicorn app.main:app --reload (from backend/)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth

app = FastAPI(title="MindCare Student Support API")

# Allow the React frontend (different port) to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/api/health")
def health():
    """Simple check that the server is running."""
    return {"status": "ok"}
