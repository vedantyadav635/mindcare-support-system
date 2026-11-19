# CLAUDE.md

## Project
College major project: **Digital Mental Health and Psychological Support System for Students in Higher Education**.

A role-based web app with three roles: **student**, **counsellor**, **admin**.
It does **NOT diagnose**. It is an early-support and referral tool.

## Stack (do not change)
- Python 3.11, FastAPI, Pydantic v2
- SQLAlchemy 2.0 ORM, Alembic, PostgreSQL 16
- python-jose (JWT), passlib[bcrypt]
- Hugging Face Transformers + PyTorch (CPU)
- pytest
- Frontend (later): React (Vite), Tailwind, Recharts

## Layout
```
backend/
  app/
    models/    SQLAlchemy tables
    schemas/   Pydantic schemas
    routers/   endpoints (thin)
    services/  business logic and AI
    core/      security.py, deps.py
    data/      JSON files
  tests/       pytest tests
  .env         secrets (git-ignored)
```

## Rules
- All endpoints live under `/api`.
- Every endpoint except register and login requires a JWT.
- Role checks use a `require_role(...)` dependency (in `core/deps.py`).
- Routers stay thin; logic goes in `services/`.
- Secrets come from `backend/.env` via pydantic-settings. Never hard-code them. `.env` stays in `.gitignore`.
- Every schema change is an Alembic migration.
- Never log chat text or passwords. Collect minimal personal data.
- Any assessment or AI response must include a non-diagnostic disclaimer.
- Write a pytest test for every new endpoint.
- Keep code simple and well commented; students must be able to explain it in a viva.
