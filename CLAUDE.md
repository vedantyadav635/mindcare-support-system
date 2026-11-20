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
- Frontend: see the **Frontend** section below

## Backend layout
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

## Backend rules
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

## Frontend

### Stack (do not change)
- React 18 with Vite, **JavaScript (not TypeScript)**
- React Router v6, Axios, Tailwind CSS, Recharts, lucide-react (icons)
- No other UI library (no MUI, no Bootstrap, no component kits)

### Layout
```
frontend/src/
  api/          client.js (the only place that talks to the backend) + one file per area
  context/      React context (e.g. auth)
  components/
    ui/         design system: Button, Card, Input, Badge, Modal, ...
    (root)      shared app parts built from ui/ (CrisisPanel, MoodChart, ...)
  layouts/      page shells (public, student, counsellor, admin)
  pages/
    auth/  student/  counsellor/  admin/
  hooks/        reusable hooks (e.g. useApi)
  utils/        small pure helpers (date formatting, ...)
  assets/       images, fonts
```

### Design tokens
- All colours, fonts, radii and shadows come from the Tailwind theme: Tailwind v4 keeps it in `src/index.css` (`@theme` block). **Never hard-code hex colours** (or pixel radii/shadows) in components. Tailwind's default palette is switched off, so only our tokens exist.
- Contrast rules (AA): dark ink-900 text on orange buttons; helper text uses ink-700 (ink-500 only for icons/borders/disabled); small orange text only brand-700 on white; status colours only as dots/borders/icons next to dark text. The live style guide is at `/design` (dev only).
- The app name "MindCare" is a placeholder: it lives only in `src/config.js` (`APP_NAME`).

### Visual style
- Warm, calm, friendly and playful, like modern meditation and wellbeing apps.
- Soft warm background, **one** bright orange accent, rounded pill buttons, large rounded cards, big friendly headings, generous white space.
- Decoration: simple flat geometric shapes (circles, blobs, arcs, stars).
- Do **not** copy any real brand's logo, name, mascot, illustrations or text.
- Motion is gentle and must be switched off for `prefers-reduced-motion`.

### API
- Every API call goes through `src/api/client.js` (an Axios instance that adds the JWT and turns errors into readable messages). No `fetch`/`axios` calls anywhere else.
- Base URL comes from `VITE_API_URL` (default `http://localhost:8000/api`).

### Pages and quality
- Every page handles **loading, empty and error** states.
- Accessible: semantic HTML, a label on every input, visible focus rings, colour contrast AA, fully usable with the keyboard.
- **Mobile first**: every page works at 360px wide.
- Assessment, chat and recommendation screens **always show the non-diagnostic disclaimer**.

### Privacy
- **Never store chat text or check-in answers in `localStorage`** (or `sessionStorage`, cookies or the URL). Keep them in component state only.
- The login token lives in memory plus `sessionStorage` (cleared when the tab closes), never in `localStorage`. Only `src/api/client.js` reads or writes it.
- Never `console.log` chat text, answers or tokens.
