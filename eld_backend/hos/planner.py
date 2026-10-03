"""
Trip planner — the high-level orchestrator.

Given the four inputs from the DOCX (current_location, pickup_location,
dropoff_location, current_cycle_used_hours), produce the two outputs:
  1. A route summary with geometry for the map
  2. Daily log sheets (one or more) for the ELD grid display
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .engine import HOSEngine, LegSpec, ScheduleResult
from .routing import geocode, get_route, meters_to_miles, seconds_to_minutes
from .logs import build_daily_logs, DEFAULT_DRIVER
from .constants import PICKUP_DWELL_MIN, DROPOFF_DWELL_MIN


def plan_trip(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    current_cycle_used_hours: float,
    start_dt: Optional[datetime] = None,
    driver_profile: Optional[Dict] = None,
) -> Dict:
    """
    Full trip plan. Returns a dict suitable for direct JSON serialization
    to the frontend.

    Steps:
      1. Geocode the 3 place names (current, pickup, dropoff) via Nominatim.
      2. Get a single OSRM route through all 3 waypoints.
      3. Split the OSRM route into two legs: current→pickup, pickup→dropoff.
      4. Run the HOS engine on the two legs.
      5. Build daily log sheets from the schedule.
      6. Return everything to the frontend.
    """
    # Default start: today at 08:00 local
    if start_dt is None:
        start_dt = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)

    # --- 1. Geocode ---
    cur = geocode(current_location)
    pck = geocode(pickup_location)
    drp = geocode(dropoff_location)

    waypoints = [cur, pck, drp]

    # --- 2. Single OSRM route through all 3 waypoints ---
    route = get_route(waypoints)
    legs_raw = route["legs"]  # 2 legs: [cur→pck, pck→drp]

    # --- 3. Build LegSpec list for the engine ---
    legs: List[LegSpec] = []
    for leg in legs_raw:
        legs.append(LegSpec(
            from_name=leg["from_name"],
            to_name=leg["to_name"],
            distance_mi=meters_to_miles(leg["distance_m"]),
            drive_min=seconds_to_minutes(leg["duration_s"]),
        ))

    # --- 4. HOS engine ---
    engine = HOSEngine(cycle_used_hours=current_cycle_used_hours)
    schedule: ScheduleResult = engine.plan(legs, start_dt)

    # --- 5. Daily logs ---
    daily_logs = build_daily_logs(schedule, current_cycle_used_hours, driver_profile)

    # --- 6. Compose final response ---
    # Compute total distance and drive time from the route (OSRM's authoritative figures)
    total_distance_mi = sum(l.distance_mi for l in legs)
    total_drive_min = sum(l.drive_min for l in legs)

    # Determine compliance summary
    cycle_remaining_min = 70 * 60 - (current_cycle_used_hours * 60 + schedule.cycle_used_min)
    cycle_remaining_h = max(0.0, cycle_remaining_min / 60.0)

    # Driving today (day 1 only)
    driving_today_min = sum(
        (e.end - e.start).total_seconds() / 60
        for e in schedule.events
        if e.status == "D" and e.start.date() == start_dt.date()
    )
    duty_today_min = sum(
        (e.end - e.start).total_seconds() / 60
        for e in schedule.events
        if e.status in ("D", "ON") and e.start.date() == start_dt.date()
    )

    # Compliance — did we stay within all limits on day 1?
    compliant = driving_today_min <= 11 * 60 and duty_today_min <= 14 * 60
    if cycle_remaining_min < 0:
        compliant = False

    # Final stopovers (for the itinerary sidebar on the map screen)
    itinerary = _build_itinerary(schedule.events, legs, cur, pck, drp)

    return {
        "route": {
            "total_distance_mi": round(total_distance_mi, 1),
            "total_drive_min": round(total_drive_min, 1),
            "total_drive_h": round(total_drive_min / 60.0, 2),
            "geometry": route["geometry"],         # [[lon, lat], ...]
            "legs": [
                {
                    "from": l.from_name, "to": l.to_name,
                    "distance_mi": round(l.distance_mi, 1),
                    "drive_min": round(l.drive_min, 1),
                } for l in legs
            ],
            "waypoints": [
                {"name": w["name"], "lat": w["lat"], "lon": w["lon"],
                 "display_name": w["display_name"]}
                for w in waypoints
            ],
        },
        "schedule": schedule.to_dict(),
        "daily_logs": daily_logs,
        "summary": {
            "compliant": compliant,
            "alerts": schedule.alerts,
            "num_days": len(daily_logs),
            "driving_today_h": round(driving_today_min / 60.0, 2),
            "driving_today_remaining_h": round(max(0.0, 11 * 60 - driving_today_min) / 60.0, 2),
            "duty_window_today_h": round(duty_today_min / 60.0, 2),
            "duty_window_remaining_h": round(max(0.0, 14 * 60 - duty_today_min) / 60.0, 2),
            "cycle_used_h": round(current_cycle_used_hours + schedule.cycle_used_min / 60.0, 2),
            "cycle_remaining_h": round(cycle_remaining_h, 2),
            "cycle_limit_h": 70,
        },
        "itinerary": itinerary,
        "driver": {**DEFAULT_DRIVER, **(driver_profile or {})},
        "trip_inputs": {
            "current_location": current_location,
            "pickup_location": pickup_location,
            "dropoff_location": dropoff_location,
            "current_cycle_used_hours": current_cycle_used_hours,
            "start_dt": start_dt.isoformat(),
        },
    }


def _build_itinerary(events, legs, cur, pck, drp) -> List[Dict]:
    """Build the stops & rests itinerary for the map sidebar."""
    out = []
    # Origin
    out.append({
        "kind": "origin",
        "label": "ORIGIN",
        "title": cur["display_name"].split(",")[0],
        "subtitle": cur["display_name"],
        "time": events[0].start.isoformat() if events else None,
    })
    # Walk events and emit pickup, breaks, fuel, dropoff in order
    for ev in events:
        if ev.status == "ON" and "Pickup" in ev.remark:
            out.append({"kind": "pickup", "label": "PICKUP",
                        "title": pck["display_name"].split(",")[0],
                        "subtitle": pck["display_name"],
                        "time_start": ev.start.isoformat(),
                        "time_end": ev.end.isoformat(),
                        "duration_min": PICKUP_DWELL_MIN})
        elif ev.status == "OFF" and "30-min" in ev.remark:
            out.append({"kind": "break", "label": "HOS BREAK",
                        "title": ev.location,
                        "subtitle": "30-min rest break (FMCSA §395.3(a)(3)(ii))",
                        "time_start": ev.start.isoformat(),
                        "time_end": ev.end.isoformat(),
                        "duration_min": 30})
        elif ev.status == "ON" and "Fuel" in ev.remark:
            out.append({"kind": "fuel", "label": "FUEL STOP",
                        "title": ev.location,
                        "subtitle": "15-min on-duty fuel (1,000-mi rule)",
                        "time_start": ev.start.isoformat(),
                        "time_end": ev.end.isoformat(),
                        "duration_min": 15})
        elif ev.status == "SB":
            out.append({"kind": "sleeper", "label": "SLEEPER BERTH",
                        "title": ev.location,
                        "subtitle": "10-hr sleeper — resets 11h drive & 14h window",
                        "time_start": ev.start.isoformat(),
                        "time_end": ev.end.isoformat(),
                        "duration_min": 10 * 60})
    # Dropoff
    out.append({
        "kind": "destination", "label": "DESTINATION",
        "title": drp["display_name"].split(",")[0],
        "subtitle": drp["display_name"],
        "time": events[-1].end.isoformat() if events else None,
    })
    return out
