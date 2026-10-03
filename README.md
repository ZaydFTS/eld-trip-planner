# ELD Trip Planner

A full-stack app that takes trip details (current location, pickup, dropoff, current cycle used) and produces (1) an interactive route map with stops & rests and (2) FMCSA Driver's Daily Log sheets — fully compliant with US FMCSA 49 CFR Part 395 for property-carrying CMV drivers (70hr/8-day cycle).

**Stack**: Django REST Framework backend + Vite/React/TypeScript frontend.
**Free APIs**: OSRM (routing), Nominatim (geocoding), OpenStreetMap tiles (map) — no API keys required.

## Live demo

- Frontend: https://eld-trip-planner.vercel.app
- Backend API: https://eld-trip-planner-api.onrender.com/api/health

## Quick start (local)

### Backend
```bash
cd eld_backend
pip install -r requirements.txt
cp .env.example .env       # adjust if needed
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd eld_frontend
npm install
npm run dev
```

Visit http://localhost:5173 — Vite proxies `/api/*` to Django at `:8000`.

## Project structure
```
eld_backend/        # Django REST API + HOS engine
eld_frontend/       # Vite + React + TypeScript
render.yaml         # Render Blueprint (one-click backend deploy)
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

## HOS rules enforced
- 11-hour driving limit (since last 10h+ off)
- 14-hour duty window (since last 10h+ off)
- 30-min rest break after 8 cumulative hours of driving
- 70hr / 8-day rolling cycle limit
- Fueling every 1,000 miles (15-min on-duty stop)
- 1-hour pickup + drop-off dwell
- Pre-trip + post-trip inspections
- Multi-day trips with 10-hour sleeper berth resets

## Built for the Full-Stack Developer assessment
