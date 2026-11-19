# MindCare frontend

React 18 (Vite, JavaScript) · React Router v6 · Axios · Tailwind CSS v4 · Recharts · lucide-react.
Rules for this folder are in the root `CLAUDE.md` (Frontend section).

## Run

```powershell
cd frontend
npm install          # first time only
npm run dev          # http://localhost:5173
```

The backend should run on http://localhost:8000. To use another address, copy `.env.example` to `.env`
and set `VITE_API_URL`.

Other commands: `npm run build` (production build into `dist/`), `npm run lint`.

## Design system

- **Tokens** (colours, fonts, type scale, radii, shadows, motion): `src/index.css`, in the `@theme` block.
  Tailwind's default colours are switched off, so only our tokens can be used.
- **Components**: `src/components/ui/` (Button, Card, FormField, OptionCard, Modal, Toast, ...).
  Import them from `src/components/ui`.
- **Style guide**: open http://localhost:5173/design while `npm run dev` is running (not included in production builds).
- **App name**: `src/config.js` (`APP_NAME`).
