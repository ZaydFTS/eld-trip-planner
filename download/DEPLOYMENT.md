# ELD Trip Planner — Deployment Guide

Three deployment targets in order: backend (Render) → frontend (Vercel) → GitHub push. Total time: ~20 minutes.

## 0. Prerequisites

- A GitHub account
- The repo pushed to GitHub (see step 3)
- Free accounts on Render.com and Vercel.com

---

## 1. Backend → Render.com

### 1a. Create `requirements.txt`

In `eld_backend/`:

```
Django==6.1.1
djangorestframework==3.18.1
django-cors-headers==4.4.0
requests==2.32.5
gunicorn==23.0.0
whitenoise==6.7.0
```

### 1b. Tweak `settings.py` for production

```python
# eld_backend/eld_trip_planner_backend/settings.py

import os

DEBUG = os.environ.get("DEBUG", "False") == "True"
SECRET_KEY = os.environ.get("SECRET_KEY", "django-insecure-5)klgu+1(o=9937$=ryl-bfjpj%_c^e0g4)iuc&7a)cg3fmw4&")
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# Add Render's domain once you have it (e.g. eld-trip-planner-api.onrender.com)
RENDER_EXTERNAL_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# WhiteNoise for static files (DRF Browsable API)
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Restrict CORS to your Vercel domain
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://eld-trip-planner.vercel.app",   # replace with your actual Vercel URL
    "http://localhost:5173",                  # local dev
]
```

### 1c. Render Web Service

1. Push to GitHub.
2. On Render dashboard → **New +** → **Web Service** → connect your repo.
3. Settings:
   - **Name**: `eld-trip-planner-api`
   - **Region**: closest to your users (e.g. Oregon)
   - **Branch**: `main`
   - **Root Directory**: `eld_backend`
   - **Runtime**: Python 3.12
   - **Build Command**:
     ```
     pip install -r requirements.txt && python manage.py migrate --noinput && python manage.py collectstatic --noinput
     ```
   - **Start Command**:
     ```
     gunicorn eld_trip_planner_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2
     ```
   - **Environment Variables**:
     - `SECRET_KEY` → generate a new 50-char secret
     - `DEBUG` → `False`
     - `PYTHON_VERSION` → `3.12.14`
4. **Create Web Service**. Render will build + deploy. First deploy takes ~2 min.
5. Note the URL: `https://eld-trip-planner-api.onrender.com`.
6. Verify: `curl https://eld-trip-planner-api.onrender.com/api/health` → `{"status":"ok",...}`

---

## 2. Frontend → Vercel

### 2a. Create `.env` files

In `eld_frontend/`:

```bash
# .env.production
VITE_API_BASE=https://eld-trip-planner-api.onrender.com
```

### 2b. Vercel project

1. On Vercel dashboard → **Add New…** → **Project** → import your repo.
2. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `eld_frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - **Environment Variables**:
     - `VITE_API_BASE` → `https://eld-trip-planner-api.onrender.com` (use your Render URL from step 1c)
3. **Deploy**. Build takes ~30 sec.
4. Note the URL: `https://eld-trip-planner.vercel.app` (Vercel auto-assigns a domain).

### 2c. Update CORS

Once you have the Vercel URL, go back to Render → environment variables → set:

```
CORS_ALLOWED_ORIGINS=https://eld-trip-planner.vercel.app,http://localhost:5173
```

(And/or update `settings.py` to include the Vercel URL — but Render supports env overrides, so this is optional.)

---

## 3. GitHub repository

```bash
cd /home/z/my-project
git init
git add eld_backend/ eld_frontend/ download/README.md download/DEPLOYMENT.md
git commit -m "ELD Trip Planner — Django+React full-stack app"
git branch -M main
git remote add origin https://github.com/<your-username>/eld-trip-planner.git
git push -u origin main
```

Add a `LICENSE`, `.gitignore` (exclude `node_modules/`, `__pycache__/`, `*.sqlite3`, `dist/`, `.env`), and a top-level `README.md` linking to the live demo + Loom.

---

## 4. Loom video (3–5 min)

Outline:

1. **0:00–0:30 — Intro**: "ELD Trip Planner, a Django+React app that takes trip details and produces compliant FMCSA daily logs."
2. **0:30–1:00 — Inputs**: Show the form, fill in Chicago → Joliet → Detroit, 35h cycle.
3. **1:00–1:30 — Route Map**: Point out the polyline, numbered markers, itinerary timeline, HOS telemetry widget (11h/14h/70h bars).
4. **1:30–2:30 — Daily Logs**: Click the Daily Logs tab, walk through the FMCSA grid (4 rows × 24h), point out the duty segments in the correct rows, header info, remarks, 70hr/8-day recap.
5. **2:30–3:30 — Long trip demo**: Click a sample or enter LA → Phoenix → Houston. Show multi-day logs, sleeper berth inserted at 11h limit, 30-min break at 8h, fuel stop at 1000mi.
6. **3:30–4:00 — Code walkthrough**: Show `hos/engine.py` (the HOS rules), `hos/routing.py` (OSRM client), `LogSheet.tsx` (the grid renderer).
7. **4:00–4:30 — Deploy**: Mention Vercel + Render URLs, link in the README.

---

## 5. Submission checklist

- [ ] Live hosted version (Vercel URL)
- [ ] GitHub repo link
- [ ] Loom video (3–5 min) covering app + code
- [ ] Accuracy: HOS rules enforced correctly (11h, 14h, 30min break, 70h/8day, fuel@1000mi, 1hr pickup/dropoff)
- [ ] UI/UX: clean Stitch design applied
- [ ] Multi-day log sheets for long trips
