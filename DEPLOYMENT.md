# ELD Trip Planner — Deployment Guide

The code is **production-ready**. Three steps:

1. **Push to GitHub** (~2 min)
2. **Deploy backend on Render** (~5 min, has `render.yaml` blueprint)
3. **Deploy frontend on Vercel** (~2 min, has `vercel.json`)

Then record the Loom and submit.

---

## Step 1 — Push to GitHub

### 1a. Create a new GitHub repo

Go to https://github.com/new and create a new repo:
- **Name**: `eld-trip-planner`
- **Visibility**: Public (so the grader can see the code)
- **Do NOT initialize** with README/.gitignore/license — we'll push the existing repo

### 1b. Push the local repo

From the project root (`/home/z/my-project/`):

```bash
git remote add origin https://github.com/<YOUR_USERNAME>/eld-trip-planner.git
git branch -M main
git push -u origin main
```

GitHub may prompt for credentials. Use a [Personal Access Token](https://github.com/settings/tokens) (classic, with `repo` scope) as the password.

### 1c. Verify

Refresh the GitHub repo page. You should see:
- `eld_backend/` with all the Python files
- `eld_frontend/` with the React app
- `render.yaml`, `eld_frontend/vercel.json`, `README.md`, `DEPLOYMENT.md`

---

## Step 2 — Deploy backend on Render

### 2a. Use the Blueprint (one-click)

1. Go to https://dashboard.render.com/blueprints
2. Click **New Blueprint**
3. Select your `eld-trip-planner` GitHub repo
4. Render auto-detects `render.yaml` and shows a service called `eld-trip-planner-api`
5. Click **Apply**
6. Render builds + deploys. First deploy takes ~2 min.

### 2b. Get your backend URL

When deployment finishes, Render gives you a URL like:
`https://eld-trip-planner-api.onrender.com`

### 2c. Verify the backend

```bash
curl https://eld-trip-planner-api.onrender.com/api/health
# → {"status":"ok","service":"eld-trip-planner-backend","version":"1.0"}

curl -X POST https://eld-trip-planner-api.onrender.com/api/plan \
  -H "Content-Type: application/json" \
  -d '{"current_location":"Chicago, IL","pickup_location":"Joliet, IL","dropoff_location":"Detroit, MI","current_cycle_used_hours":35}'
# → 100KB+ of JSON with route, schedule, daily_logs, summary
```

If both work, the backend is live.

---

## Step 3 — Deploy frontend on Vercel

### 3a. Import the repo

1. Go to https://vercel.com/new
2. Import your `eld-trip-planner` GitHub repo
3. Vercel auto-detects Vite from `eld_frontend/vercel.json`

### 3b. Configure build settings

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `eld_frontend` |
| Build Command | `npm run build` (auto-filled) |
| Output Directory | `dist` (auto-filled) |
| Install Command | `npm install` (auto-filled) |

### 3c. Add the backend URL as an env var

Under **Environment Variables**, add:

| Name | Value |
|---|---|
| `VITE_API_BASE` | `https://eld-trip-planner-api.onrender.com` (your Render URL from step 2b) |

### 3d. Deploy

Click **Deploy**. Vercel builds in ~30s and gives you a URL like:
`https://eld-trip-planner.vercel.app`

### 3e. Update CORS on Render

Go back to Render → your `eld-trip-planner-api` service → Environment → update:

```
CORS_ALLOWED_ORIGINS=https://eld-trip-planner.vercel.app,http://localhost:5173
```

(Use your actual Vercel URL.) Render auto-redeploys on env change.

---

## Step 4 — Verify end-to-end

Visit your Vercel URL in a browser:
1. ✅ The landing form loads with the Stitch design
2. ✅ Click "Midwest Intermodal" sample → results load with map + itinerary
3. ✅ Click "Daily Logs" tab → FMCSA grid with continuous duty line
4. ✅ Try LA → Phoenix → Houston with cycle = 20 → 3 days of logs

If anything fails:
- Backend not reachable → check Render logs, verify `ALLOWED_HOSTS` includes `eld-trip-planner-api.onrender.com`
- CORS errors → verify `CORS_ALLOWED_ORIGINS` on Render includes your Vercel URL
- Map not loading → check browser console, OpenStreetMap tiles should load from `tile.openstreetmap.org`

---

## Step 5 — Record the Loom (3–5 min)

Outline:
1. **0:00–0:30** — Intro: "ELD Trip Planner, Django + React, takes trip details and produces FMCSA daily logs."
2. **0:30–1:00** — Inputs: fill Chicago → Joliet → Detroit, 35h cycle
3. **1:00–1:30** — Route Map: polyline, numbered markers, itinerary sidebar, HOS telemetry widget
4. **1:30–2:30** — Daily Logs: walk through FMCSA grid, point at continuous duty line crossing rows, header info, recap table
5. **2:30–3:30** — Long trip: enter LA → Phoenix → Houston, cycle = 20, show multi-day logs, sleeper berth at 11h limit, 30min break at 8h, fuel at 1000mi
6. **3:30–4:30** — Code walkthrough: `eld_backend/hos/engine.py` (HOS rules), `eld_backend/hos/routing.py` (OSRM), `eld_frontend/src/components/LogSheet.tsx` (grid + SVG duty line)
7. **4:30–5:00** — Live URLs: Vercel + Render + GitHub link

---

## Step 6 — Submit

Submit:
- ✅ Live Vercel URL
- ✅ GitHub repo link
- ✅ Loom video link

Collect the $100 reward.

---

## Reference: Environment variables

### Backend (Render)
| Var | Required | Example |
|---|---|---|
| `SECRET_KEY` | ✅ (auto-generated by `render.yaml`) | 50-char random string |
| `DEBUG` | ✅ | `False` |
| `PYTHON_VERSION` | ✅ | `3.12.14` |
| `ALLOWED_HOSTS` | optional | `localhost,127.0.0.1` (Render auto-injects `RENDER_EXTERNAL_HOSTNAME`) |
| `CORS_ALLOWED_ORIGINS` | ✅ | `https://eld-trip-planner.vercel.app,http://localhost:5173` |

### Frontend (Vercel)
| Var | Required | Example |
|---|---|---|
| `VITE_API_BASE` | ✅ | `https://eld-trip-planner-api.onrender.com` |
