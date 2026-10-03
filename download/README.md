# ELD Trip Planner

A full-stack web app that takes trip details as inputs and produces (1) an interactive route map with stops/rests and (2) FMCSA Driver's Daily Log sheets (the "ELD grid") — fully compliant with US FMCSA 49 CFR Part 395 for property-carrying CMV drivers (70hr/8-day cycle).

Built with **Django REST Framework** backend + **Vite/React/TypeScript** frontend, using free/open APIs (OSRM for routing, Nominatim for geocoding, OpenStreetMap tiles for the map).

## Features

### Inputs (per the assessment DOCX)
- Current location
- Pickup location
- Dropoff location
- Current Cycle Used (Hrs)

### Outputs
1. **Interactive route map** — Leaflet + OpenStreetMap, navy route polyline with amber glow, numbered waypoint markers (Origin / Pickup / Dropoff), intermediate stops (HOS breaks, fuel, sleeper berth), and a Stops & Rests itinerary timeline on the left.
2. **FMCSA Driver's Daily Log sheets** — one per calendar day, faithfully rendered: 4-row × 24-hour grid (Off Duty / Sleeper Berth / Driving / On Duty), 15-min subdivisions, header info grid (driver/carrier/truck/miles/shipping docs), remarks/audit log, and a 70hr/8-day cycle recap table with signature block.

### HOS rules enforced (the brain)
- **11-hour driving limit** since last 10h+ off duty
- **14-hour duty window** since last 10h+ off duty
- **30-min rest break** after 8 cumulative hours of driving (does NOT reset 11h/14h)
- **70hr/8-day cycle** with rolling recap
- **Fueling every 1,000 miles** (15-min on-duty stop)
- **1-hour pickup + drop-off dwell**
- Pre-trip + post-trip inspections (15 min each)
- Multi-day trips split at midnight, with 10h sleeper berth inserted automatically when 11h drive or 14h window is exhausted

## Project structure

```
/home/z/my-project/
├── eld_backend/                     # Django REST backend
│   ├── eld_trip_planner_backend/    # project settings
│   ├── trips/                       # REST endpoints (/api/plan, /api/samples, /api/driver)
│   ├── hos/                         # HOS engine + routing + log generator
│   │   ├── constants.py             # FMCSA constants (11h, 14h, 30min, 70h, 1000mi, etc.)
│   │   ├── engine.py                # HOSEngine — pure scheduling logic
│   │   ├── routing.py               # OSRM + Nominatim client
│   │   ├── logs.py                  # duty events → daily log sheets
│   │   └── planner.py               # top-level orchestrator
│   └── manage.py
└── eld_frontend/                    # Vite/React frontend
    ├── src/
    │   ├── App.tsx                  # view router (input ↔ results)
    │   ├── api.ts                  # backend client
    │   ├── types.ts                # TypeScript types matching backend response
    │   ├── components/
    │   │   ├── TopAppBar.tsx
    │   │   ├── Banners.tsx
    │   │   ├── RouteMapPanel.tsx    # Leaflet map + itinerary sidebar + HOS telemetry
    │   │   ├── DailyLogsPanel.tsx  # day selector + log sheet
    │   │   └── LogSheet.tsx        # THE FMCSA grid (signature visual)
    │   └── screens/
    │       ├── TripInputScreen.tsx # Screen 1 — trip form + samples
    │       └── ResultsScreen.tsx   # Screen 2/3 — tabbed results
    ├── tailwind.config.js          # Stitch DESIGN.md tokens (navy/amber/Inter)
    └── vite.config.ts
```

## Run locally

### 1. Backend (Django)

```bash
cd eld_backend
pip install django djangorestframework django-cors-headers requests
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

API endpoints:
- `GET  /api/health` — health check
- `GET  /api/samples` — list sample trips
- `GET  /api/driver` — default driver/carrier profile
- `POST /api/plan` — plan a trip (body: current_location, pickup_location, dropoff_location, current_cycle_used_hours)
- `GET  /api/plan/sample/<id>` — plan a sample trip by id

### 2. Frontend (Vite/React)

```bash
cd eld_frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. The Vite dev server proxies `/api/*` to Django at `:8000`.

## Deploy to production

### Backend → Render.com

1. Push the repo to GitHub.
2. On Render, create a new **Web Service** from the GitHub repo.
3. Settings:
   - **Root Directory**: `eld_backend`
   - **Build Command**: `pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn eld_trip_planner_backend.wsgi:application --bind 0.0.0.0:$PORT`
   - Add `gunicorn` to `requirements.txt`.
4. Set environment variable `DJANGO_SETTINGS_MODULE=eld_trip_planner_backend.settings` and `DEBUG=False`.
5. Add your Render URL to `ALLOWED_HOSTS` in `settings.py`.
6. Deploy — you'll get a URL like `https://eld-trip-planner-api.onrender.com`.

### Frontend → Vercel

1. On Vercel, import the GitHub repo.
2. Settings:
   - **Root Directory**: `eld_frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**: `VITE_API_BASE=https://eld-trip-planner-api.onrender.com`
3. Deploy — you'll get a URL like `https://eld-trip-planner.vercel.app`.

## Sample trips (built-in)

| id | name | route | distance | cycle used |
|---|---|---|---|---|
| `midwest-intermodal` | Midwest Intermodal | Chicago, IL → Joliet, IL → Detroit, MI | ~337 mi | 35h |
| `texas-gulf-express` | Texas Gulf Express | Dallas, TX → Houston, TX → Galveston, TX | ~240 mi | 20h |
| `i10-southwest` | I-10 Southwest | Los Angeles, CA → Palm Springs, CA → Phoenix, AZ | ~370 mi | 45h |

## Free APIs used

- **OSRM** (`router.project-osrm.org`) — driving routes, distances, durations, geometry. No API key.
- **Nominatim** (`nominatim.openstreetmap.org`) — place name geocoding. No API key.
- **OpenStreetMap tiles** — map background. No API key.

For higher volume, self-host OSRM and use a Mapbox/MapQuest API key. The architecture isolates the routing service in `hos/routing.py`, so swapping providers is a one-file change.

## Tech stack

- **Backend**: Django 6, Django REST Framework 3, django-cors-headers, requests
- **Frontend**: Vite 8, React 19, TypeScript 7, Tailwind CSS 3, react-leaflet 5, leaflet 1, lucide-react
- **Map**: Leaflet + OpenStreetMap raster tiles
- **Design system**: Stitch AI DESIGN.md — Inter typeface, navy `#0B2545` + amber `#F59E0B` palette, 10px/8px/4px radii, tabular numerals

## HOS algorithm

The scheduling engine (`hos/engine.py`) is pure, deterministic, and minute-accurate. For each driving leg it:

1. Checks every active HOS limit BEFORE driving each chunk:
   - 11h drive limit → if exhausted, takes a 10h sleeper berth (resets 11h + 14h)
   - 14h duty window → if exhausted, takes a 10h sleeper berth
   - 8h driving rule → if exhausted, takes a 30-min off-duty rest (resets 8h counter only)
   - 70h cycle → if exhausted, alerts (would need 34h restart; not auto-inserted)
2. Drives the largest chunk that fits every remaining budget.
3. Caps the chunk at the next 1,000-mi fuel boundary; inserts a 15-min on-duty fuel stop at the boundary.
4. After each chunk, updates all counters and continues.
5. Inserts 1h on-duty dwell at pickup and dropoff, plus 15-min pre-trip and post-trip inspections.

The result is a list of duty events with absolute timestamps. The log generator (`hos/logs.py`) splits these at midnight into per-day segments (each with `start_min`/`end_min` measured from that day's midnight) for the grid renderer.

## License & credits

Map data © OpenStreetMap contributors. Routing © OSRM. Geocoding © Nominatim. Design tokens © Stitch AI.

— Built for the Full-Stack Developer assessment.
