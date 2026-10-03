# Stitch AI Prompt — ELD Trip Planner & Daily Log Generator

> Copy everything below the line into Stitch AI (stitch.withgoogle.com).

---

## Project Overview

Build a modern, professional web application called **"ELD Trip Planner"** — a tool for interstate truck drivers (property-carrying, 70-hour/8-day cycle) that takes trip details as input and produces two outputs: (1) an interactive route map with stops and rest periods, and (2) FMCSA-style daily log sheets (the driver's "grid" log) auto-filled based on the computed schedule.

The aesthetic should feel like a premium logistics SaaS dashboard — think a blend of Convoy, Uber Freight, and KeepTruckin (Motive). Clean, trustworthy, data-dense but never cluttered. The audience is professional drivers and fleet dispatchers, so the UI must be fast to scan and easy to use on both desktop and tablet.

## Design Language & Tokens

- **Style**: Modern logistics dashboard — flat, crisp, with a hint of "highway" industrial character.
- **Primary color**: Deep navy `#0B2545` (authoritative, trustworthy).
- **Accent color**: Highway amber/orange `#F59E0B` (mirrors road-sign aesthetics, used for CTAs and active route highlights).
- **Secondary accent**: Steel blue `#1E3A8A` for info states; success green `#10B981` for compliant/HOS-OK badges; warning red `#DC2626` for HOS violations.
- **Background**: Very light slate `#F8FAFC` for the app shell; pure white `#FFFFFF` for cards/panels.
- **Typography**: Use **Inter** for everything (UI, headings, body). Monospace tabular numbers (Inter's `font-feature-settings: 'tnum'`) for all time/hours/distance figures so columns align. Headings are bold; labels are medium 500; helper text is regular 400 at 60% opacity.
- **Corner radius**: 10px on cards, 8px on inputs/buttons, 4px on chips/badges.
- **Shadows**: Soft, low-spread. `0 1px 2px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)`.
- **Spacing system**: 4px base grid (8, 12, 16, 24, 32, 48).
- **Icons**: Lucide-style line icons (truck, map-pin, clock, fuel, moon, document). 1.5px stroke.
- **No emojis.** Use real SVG icons everywhere.

## App Structure — 3 Screens

### Screen 1 — Trip Input (Landing)

A focused, single-column hero form centered on the page (max-width ~720px), framed by a slim top app bar.

**Top App Bar (sticky, 64px tall):**
- Left: a truck-in-circle logo mark in navy + wordmark "ELD Trip Planner" (semibold).
- Right: a small badge "70hr / 8-day cycle" in steel-blue chip, and a ghost button "How it works" that opens a side sheet.

**Hero / Form Card:**
- Page H1: "Plan a compliant trip" (32px, bold, navy).
- Subtext (15px, slate-500): "Enter your trip details. We'll map the route and generate FMCSA daily log sheets automatically — fueling, breaks, and HOS limits included."
- **Form fields** (stacked, 16px gap, each with a label above and helper text below):
  1. **Current location** — text input with a map-pin icon on the left, autocomplete-style dropdown shadow underneath (just show the styled input + a sample suggestion chip row below it).
  2. **Pickup location** — same input style, with a small "Pickup · 1 hr dwell" tag to the right.
  3. **Dropoff location** — same input style, with a small "Dropoff · 1 hr dwell" tag to the right.
  4. **Current Cycle Used (Hrs)** — number input (0–70) with a stepper, plus a thin horizontal progress bar beneath showing used-vs-remaining (e.g. 35 hrs used → bar 50% amber, remaining "35.0 hrs available this cycle"). Label the bar ends "0h" and "70h".
- **Generate button** (full-width on mobile, right-aligned on desktop): amber `#F59E0B`, navy text, 44px tall, "Generate route & logs →".
- **Secondary link** below: "Clear" ghost text button.

**Bottom of the screen — Assumptions strip** (subtle slate-100 bar, full-width, 3 columns):
- "Property-carrying · 70hr/8day"  •  "Fueling every 1,000 mi"  •  "1 hr pickup & drop-off dwell"
Each with a tiny lucide icon. Helper text below: "No adverse driving conditions assumed."

### Screen 2 — Results View (the main dashboard)

A two-tab layout. Top of the screen: a trip summary header band, then a tab switcher: **[ Route Map ]  [ Daily Logs ]**. Show both tabs' content stacked is also acceptable on wide desktop (map on top ~60% height, logs below), but the tab switcher is the primary pattern.

**Trip Summary Header Band** (sticky, navy `#0B2545` background, white text, 72px tall):
- Left: "Trip · Oct 4, 2026" small label + H2 route line "Chicago, IL → Joliet, IL → Detroit, MI" with small truck icon.
- Center: 3 KPI chips horizontally — "Total distance 282 mi", "Est. driving 5h 20m", "Logs generated 2".
- Right: "Compliant ✓" green badge OR "Review needed ⚠" amber badge. A ghost "Export PDF" button (white outline).

**Tab 1 — Route Map:**
- Full-width map card (80vh on desktop, 60vh on mobile). Style it like a modern map UI: light map tiles, a navy route polyline with an amber glow, waypoints as numbered circular markers (1 = Start, 2 = Pickup, 3 = Fuel, 4 = 30-min break, 5 = Dropoff).
- **Left sidebar overlay (320px wide, white card, soft shadow)** — "Stops & Rests" itinerary:
  - A vertical timeline. Each stop is a row with: a circular numbered marker, location name, an icon (truck-start / warehouse-pickup / fuel / coffee-break / flag-dropoff), an arrival–departure time range (e.g. "08:00 – 09:00 · Pickup · 1h dwell"), and a small mileage tag.
  - Between stops, show a connecting line with the drive segment's duration and distance ("1h 45m · 95 mi") centered on the line.
  - Color-code duty segments subtly: driving = navy line, on-duty (pickup/dropoff) = amber dashed line, off-duty/sleeper = slate gray line.
- **Right edge mini-panel** (collapsible, 240px): "HOS status" — a compact stack of progress bars: Driving today (X/11h), On-duty window (X/14h), 8-day cycle (X/70h). Each bar shows the limit and remaining.

**Tab 2 — Daily Logs:**
- A horizontal scrollable strip of "day cards" at the top (like film thumbnails): "Day 1 · Oct 4", "Day 2 · Oct 5" — click to jump to that log below.
- Below: the **Daily Log Sheet** itself, rendered as a faithful digital recreation of the FMCSA paper grid log (see Screen 3 for the spec — same component, just rendered for the selected day). One log visible at a time, with prev/next chevrons.
- A "Download all logs (PDF)" amber outline button in the top-right of the logs tab.

### Screen 3 — The Daily Log Sheet Component (CRITICAL — must be pixel-faithful)

This is the signature output of the app. Build it as a self-contained card that recreates the FMCSA Driver's Daily Log grid. It must look like a real, fillable paper log that has been auto-completed.

**Layout (portrait-oriented card, max-width 850px, white background, 1px slate-200 border, 12px radius):**

**A. Header block (top ~22%):**
- Top row: bold title "Driver's Daily Log" (left, 20px navy), and on the right small italic helper text "24-Hour Period".
- Date row: a label "Date" then three boxed fields `MM / DD / YYYY` (auto-filled, e.g. `10 / 04 / 2026`), and to the right "From 00:00 — To 24:00".
- A 2-column × 4-row grid of labeled fields (each field is a thin slate-100 box with the label tiny below in uppercase slate-500):
  - "Driver Name" → "James Carter"
  - "Main Office Address" → "Carrier HQ, 100 Fleet St, Chicago, IL"
  - "Carrier Name" → "Midwest Logistics LLC"
  - "Home Terminal Address" → "Terminal 4, 200 Dock Rd, Joliet, IL"
  - "Truck/Tractor #" → "IL-TRK-4471"
  - "Trailer #" → "IL-TLR-2280"
  - "Total Miles Today" → "282"
  - "Co-Driver" → "—"

**B. The Grid (center ~38%) — the heart of the log:**
- A black header bar across the top (16px tall, white text). Left edge text "midnight", then hour labels `1 2 3 4 5 6 7 8 9 10 11 NOON 1 2 3 4 5 6 7 8 9 10 11` then right edge "midnight". Right end has two narrow column headers: "Miles" and "Total Hrs".
- **Four horizontal rows**, each labeled on the far left (label column ~120px, navy semibold):
  1. **OFF DUTY**
  2. **SLEEPER BERTH**
  3. **DRIVING**
  4. **ON DUTY (not driving)**
- Vertical grid lines: bold every hour, hairline every 15 minutes (4 subdivisions per hour). The hour lines should be clearly visible; the quarter lines should be subtle slate-200.
- **The duty line**: a single continuous navy line (3px) drawn through the grid that switches rows at the exact minute a duty status changes. At each change point, draw a small filled navy dot. The line should look hand-drawn-accurate — e.g. drive 08:00–11:00 in row 3, then break 11:00–11:30 in row 1, pickup 11:30–12:30 in row 4, drive 12:30–17:00 in row 3, fuel 15:00–15:15 in row 4, etc. Render the line as an SVG path over the grid for crispness.
- Right-side totals column (two thin columns): for each row show miles (where applicable — only Driving row has miles) and total hours (e.g. Driving 4h 30m, On-Duty 2h 15m, Sleeper 8h, Off-Duty 9h 15m).

**C. Footer / Summary block (bottom ~40%):**
- **Remarks** section: bold label, then a lined writing area. Pre-fill with auto-generated remarks like: "Pre-trip completed · FUELED Pilot, Joliet IL 15:00 · Post-trip completed".
- **Shipping Documents** row: label "Shipping Documents — BOL / Manifest No." then a fillable line with the BOL number "BOL-77451".
- **Shipper & Commodity** row: shipper name and commodity, e.g. "Shipper: ACME Corp · Commodity: General Freight".
- **Daily Totals — 70 Hour / 8 Day Recap** table: a compact 4-column × 4-row table with header row `Day | On-Duty Today (A) | Available Tomorrow (B) | Last 8 Days (C)`. Show the rolling 8-day recap: rows for Day -7 through Day +1 with the hours used each day, and a bold bottom row "Recap (today)" showing A, B = 70 − A, and C = sum of last 8 days. Highlight "Available Tomorrow" cell in amber if it's the current day.

**Interaction:** The log card should have a subtle hover state (border shifts to amber) and a "Download this log (PDF)" icon button in the top-right corner.

## Component Inventory (for Stitch to generate)

Please produce these as distinct, reusable components:
1. `TopAppBar` — sticky header with logo, wordmark, cycle badge, help button.
2. `TripInputForm` — the Screen 1 hero form with the 4 inputs + cycle progress bar + Generate CTA.
3. `AssumptionsStrip` — the bottom info bar on Screen 1.
4. `TripSummaryHeader` — navy KPI band on Screen 2.
5. `TabSwitcher` — Route Map / Daily Logs toggle.
6. `RouteMapCard` — the map container with route polyline and waypoint markers.
7. `StopsTimeline` — the left-side vertical itinerary overlay.
8. `HOSStatusPanel` — the right-side mini progress bars for 11h/14h/70h.
9. `DayTabs` — horizontal scrollable day selector for logs.
10. `DailyLogSheet` — the FMCSA-style grid log (THE signature component; build it carefully).
11. `LogGrid` — the inner 4-row × 24-hour grid with the duty status SVG line.
12. `RecapTable` — the 70hr/8day recap table inside the log footer.
13. `ComplianceBadge` — green/amber/red status chip.
14. `Button` (primary amber / ghost / outline variants), `Input`, `ProgressBar`, `Chip`, `Timeline` primitives.

## States to Design

- **Empty state** (Screen 1, no input yet): show 3 sample route cards below the form ("Try a sample trip: Chicago → Detroit", "Dallas → Houston", "LA → Phoenix") as clickable suggestion chips.
- **Loading state** (after Generate pressed): a tasteful full-card skeleton — map card with a shimmer polyline, log grid with shimmer rows.
- **Results state**: as described above.
- **Error state**: amber-bordered inline banner "We couldn't route this trip. Check the locations and try again." with a retry button.
- **Compliance warning state**: if the computed schedule would exceed HOS limits, the Trip Summary badge turns amber, the offending progress bar in the HOS panel flashes red, and a dismissible banner appears: "This trip requires a 34-hour restart before Day 3. We've added a sleeper-berth reset to the schedule."

## Responsive Behavior

- Desktop (≥1024px): map + sidebar overlay + HOS mini-panel all visible.
- Tablet (768–1023px): HOS mini-panel collapses into the sidebar; logs show one at a time.
- Mobile (<768px): single column. Form fields stack. Map takes 50vh. Logs become vertically scrollable cards. Top app bar collapses to logo + menu icon.

## Tone & Microcopy

- Professional, plain-spoken. No marketing fluff.
- Use 24-hour time everywhere in logs (00:00, 14:30). Use 12-hour time with am/pm in the itinerary sidebar for friendliness (8:00 AM).
- Distances in miles. Hours to one decimal in the recap table (e.g. "4.5"), whole+h in the timeline ("4h 30m").

## What I Want From Stitch

Generate a complete, multi-screen UI mockup of this app — all 3 screens, the empty + loading + results + error + compliance-warning states, the responsive breakpoints, and especially a pixel-faithful rendering of the FMCSA Daily Log Sheet grid component. Prioritize the log grid's accuracy — it's the most important visual in the entire product.
