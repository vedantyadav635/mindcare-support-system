"""App settings, read from backend/.env (never hard-code secrets)."""
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/.env, found relative to this file so it works from any working directory
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    DATABASE_URL: str
    TEST_DATABASE_URL: str | None = None  # only needed when running pytest

    # At least 32 characters, so tokens can't be forged by guessing the secret.
    # The app refuses to start with a short one (e.g. the "change-me" placeholder).
    JWT_SECRET: str = Field(min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # Shown to students in crisis responses (not a secret, but differs per college)
    CAMPUS_COUNSELLOR_CONTACT: str = "Campus Counselling Centre (see your college website for the number)"

    # Load the Hugging Face models at startup. Tests set this to false so nothing is downloaded.
    NLP_ENABLED: bool = True

    # Comma-separated, e.g. "http://localhost:5173,http://127.0.0.1:5173"
    CORS_ORIGINS: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


# One shared settings object for the whole app
settings = Settings()
