# MindCare backend

FastAPI backend for the **Digital Mental Health and Psychological Support System for Students in Higher Education**.
Three roles: student, counsellor, admin. It is an early-support and referral tool and **does not diagnose**.

**Stack:** Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, PostgreSQL 16, JWT (python-jose),
bcrypt (passlib), Hugging Face Transformers + PyTorch (CPU), pytest.

## Contents

- [Features](#features)
- [Project layout](#project-layout)
- [Environment variables](#environment-variables)
- [Run locally](#run-locally)
- [Run with Docker](#run-with-docker)
- [Seed data](#seed-data)
- [Tests](#tests)
- [NLP evaluation](#nlp-evaluation)
- [Security notes](#security-notes)

## Features

| Area | What it does |
|---|---|
| Auth | Student registration (with consent), JWT login with rate limiting, role checks on every route |
| Daily check-in | Admin-managed questions (options or short text); mood/stress/sleep feed the trend charts |
| Assessments | PHQ-9 and GAD-7 with severity bands and a non-diagnostic disclaimer |
| Safety layer | Rule-based crisis detection (English + Hinglish) on chat, check-in text and PHQ-9 item 9; alerts counsellors and shows helplines |
| AI chat | Sentiment + emotion models (CPU), template replies, resource suggestions; safety check runs first |
| Recommendations | Explainable scores from the last 7 days, each with a "why" |
| Appointments | Counsellor slots, race-safe booking (`SELECT ... FOR UPDATE`), status workflow |
| Admin | User management, create counsellors, counts-only statistics |
| Privacy | Students can delete their account and all their data (`DELETE /api/me`) |

Interactive API docs: **http://localhost:8000/docs** (every endpoint has a description and an example).

## Project layout

```
backend/
  app/
    models/     SQLAlchemy tables
    schemas/    Pydantic request/response shapes
    routers/    endpoints (thin)
    services/   business logic, safety layer and AI
    core/       security.py (hashing, JWT), deps.py (auth dependencies), rate_limit.py
    data/       crisis lexicon, default questions and resources (JSON)
  alembic/      database migrations
  scripts/      create_admin, seed scripts, NLP evaluation
  tests/        pytest tests
```

## Environment variables

Copy `backend/.env.example` to `backend/.env` and fill it in. `.env` is git-ignored: never commit it.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `postgresql+psycopg2://USER:PASSWORD@HOST:PORT/DBNAME` (local PostgreSQL or Supabase; add `?sslmode=require` for Supabase) |
| `TEST_DATABASE_URL` | for tests | A **separate** database: tests drop all its tables |
| `JWT_SECRET` | yes | At least 32 characters; the app refuses to start otherwise. Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `JWT_ALGORITHM` | no | Default `HS256` |
| `JWT_EXPIRE_MINUTES` | no | Default `60` |
| `CORS_ORIGINS` | no | Comma-separated frontend URLs. Default `http://localhost:5173` |
| `CAMPUS_COUNSELLOR_CONTACT` | no | Shown to students in crisis responses |
| `NLP_ENABLED` | no | Default `true`. `false` skips loading the AI models (tests set this automatically) |

## Run locally

Requires Python 3.11 and PostgreSQL (local, or a Supabase project). Commands are for Windows PowerShell,
run from the `backend` folder.

```powershell
# 1. Virtual environment and dependencies (first time only)
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1          # run this in every new terminal; prompt shows (.venv)
pip install -r requirements.txt

# 2. Configuration
copy .env.example .env                # then edit .env

# 3. Databases (local PostgreSQL; skip the first line if you use Supabase)
psql -U postgres -c "CREATE DATABASE mental_health_db;"
psql -U postgres -c "CREATE DATABASE mental_health_test_db;"

# 4. Create the tables
alembic upgrade head

# 5. Start the server
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs. The first start downloads the two AI models (~800 MB) to the Hugging Face cache;
later starts only load them (a few seconds).

> If `Activate.ps1` is blocked, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
> On Linux, install the CPU build of PyTorch before step 1's `pip install`:
> `pip install torch --index-url https://download.pytorch.org/whl/cpu`.

## Run with Docker

From the **project root** (where `docker-compose.yml` is):

```powershell
copy .env.example .env      # set POSTGRES_PASSWORD and JWT_SECRET
docker compose up --build
```

This starts PostgreSQL 16 (data kept in the `pgdata` volume) and the backend, which runs
`alembic upgrade head` and then uvicorn on http://localhost:8000. The AI models are cached in the `hf_cache` volume.

Run scripts inside the running container, e.g.:

```powershell
docker compose exec backend python -m scripts.seed_checkin_questions
```

## Seed data

Run from `backend/` with the venv active (or prefix with `docker compose exec backend`). All scripts use `DATABASE_URL`.

```powershell
python -m scripts.create_admin admin@college.edu "Admin Name"   # asks for the password (8-72 chars)
python -m scripts.seed_checkin_questions                        # 7 default daily check-in questions
python -m scripts.seed_resources                                # 18 default wellness resources
```

The seed scripts only add data when their table is empty, so running them twice is safe.
Counsellors are created by an admin with `POST /api/admin/counsellors` (returns a temporary password once).

## Tests

```powershell
pytest -v
```

- Tests use `TEST_DATABASE_URL`, never your real database. Tables are created at the start and dropped at the end.
- The AI models are not loaded (`NLP_ENABLED=false`); a test with a mock proves risky chat messages never reach them.
- See the crisis-detection catch rate: `pytest tests/test_safety.py -s`

## NLP evaluation

```powershell
python -m scripts.evaluate_nlp                    # uses scripts/nlp_eval_sample.csv
python -m scripts.evaluate_nlp my_labelled.csv    # your own CSV
```

CSV columns: `text,sentiment,emotion` (sentiment: negative/neutral/positive; emotion: anger, disgust, fear, joy,
neutral, sadness, surprise). Prints accuracy, per-label results and every mistake. The included sample (38
sentences) is a smoke test; for the report, label your own set of 50-100 student-style sentences.

## Security notes

- Every endpoint except register, login and health requires a JWT; roles are checked with `require_role(...)`.
  Students only ever see their own data. Another user's appointment or slot returns 404, so IDs can't be probed.
- Passwords are bcrypt-hashed. Login: same error for wrong email or password, constant-ish time for unknown emails,
  and blocked (429) after 5 failures per email or 20 per IP within 15 minutes.
- Nothing in the app logs chat text, answers or passwords; database errors hide SQL parameters (`hide_parameters=True`).
- CORS allows only `CORS_ORIGINS`. Secrets come only from `.env`.
- Counsellors see crisis alerts with a short excerpt (max 120 characters), never the full text.
- The crisis detector is rule-based and errs on the side of caution; it is a safety net, not a replacement for people.
