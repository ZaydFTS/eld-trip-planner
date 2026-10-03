"""
Daily log sheet generator.

Converts a ScheduleResult (list of absolute-time DutyEvents) into one or more
daily log sheet objects — one per calendar day touched by the trip. Each daily
log contains:
  - date, header info (driver/carrier/truck/etc.)
  - segments: list of {start_min, end_min, status, location, remark} where
    start_min/end_min are minutes-from-midnight (0-1440). Segments crossing
    midnight are split at the boundary.
  - totals: per-status hours + miles for the day
  - recap: 8-day rolling cycle summary (today column)

The frontend renders the FMCSA paper-log grid from `segments`.
"""
from __future__ import annotations

from datetime import datetime, timedelta, date
from typing import Dict, List, Optional

from .engine import DutyEvent, ScheduleResult, LegSpec
from .constants import (
    STATUS_OFF_DUTY, STATUS_SLEEPER, STATUS_DRIVING, STATUS_ON_DUTY,
    CYCLE_LIMIT_MIN, METERS_PER_MILE,
)


# Default driver/carrier profile — used to fill the log header.
DEFAULT_DRIVER = {
    "driver_name": "James Carter",
    "carrier_name": "Midwest Logistics LLC",
    "main_office_address": "100 Fleet St, Chicago, IL 60607",
    "home_terminal_address": "Terminal 4, 200 Dock Rd, Joliet, IL 60436",
    "truck_tractor": "IL-TRK-4471",
    "trailer": "IL-TLR-2280 (53ft Dry Van)",
    "co_driver": "None / Solo Driver",
    "shipping_docs": "BOL-77451 · MIF-9902",
    "shipper_commodity": "ACME Freight Corp · Auto Parts (42,000 lbs)",
}


def _day_start(dt: datetime) -> datetime:
    """Midnight at the start of dt's day (local time)."""
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def _split_event_at_midnight(ev: DutyEvent) -> List[Dict]:
    """
    Split a single event into one or more day-local segments, breaking at
    midnight. Each returned dict has {date, start_min, end_min, status, location,
    remark, miles}.

    - start_min/end_min: minutes from that day's midnight (0-1440)
    - miles: distributed proportionally for driving events
    """
    out: List[Dict] = []
    cur = ev.start
    seg_end = ev.end
    total_min = (ev.end - ev.start).total_seconds() / 60.0
    miles_per_min = ev.miles / total_min if total_min > 0 else 0.0

    while cur < seg_end:
        day_midnight = _day_start(cur)
        next_midnight = day_midnight + timedelta(days=1)
        chunk_end = min(seg_end, next_midnight)
        start_min = (cur - day_midnight).total_seconds() / 60.0
        end_min = (chunk_end - day_midnight).total_seconds() / 60.0
        chunk_min = (chunk_end - cur).total_seconds() / 60.0
        out.append({
            "date": day_midnight.date().isoformat(),
            "start_min": round(start_min, 2),
            "end_min": round(end_min, 2),
            "status": ev.status,
            "location": ev.location,
            "remark": ev.remark,
            "miles": round(miles_per_min * chunk_min, 1) if ev.status == STATUS_DRIVING else 0.0,
        })
        cur = chunk_end
    return out


def _compute_totals(segments: List[Dict]) -> Dict:
    """Per-status totals for a single day's segments."""
    totals = {
        STATUS_OFF_DUTY: 0.0,
        STATUS_SLEEPER: 0.0,
        STATUS_DRIVING: 0.0,
        STATUS_ON_DUTY: 0.0,
    }
    miles = 0.0
    for s in segments:
        dur = s["end_min"] - s["start_min"]
        totals[s["status"]] += dur
        if s["status"] == STATUS_DRIVING:
            miles += s["miles"]
    return {
        "off_duty_h": round(totals[STATUS_OFF_DUTY] / 60.0, 2),
        "sleeper_h": round(totals[STATUS_SLEEPER] / 60.0, 2),
        "driving_h": round(totals[STATUS_DRIVING] / 60.0, 2),
        "on_duty_h": round(totals[STATUS_ON_DUTY] / 60.0, 2),
        "total_h": round(sum(totals.values()) / 60.0, 2),
        "miles": round(miles, 1),
    }


def _build_recap(cycle_used_hours: float, trip_duty_min: float, prev_days: int = 7) -> Dict:
    """
    Build the 70hr/8-day rolling recap table.

    The recap shows: for each of the previous 7 days + today, the on-duty hours
    used. The 'today' row includes the duty minutes added by THIS trip's
    scheduling (split across days as needed).
    """
    # Distribute incoming cycle_used across 7 prior days (heuristic even split)
    avg = (cycle_used_hours / prev_days) if cycle_used_hours > 0 else 0
    rows = []
    today = date.today()
    for i in range(prev_days, 0, -1):
        d = today - timedelta(days=i)
        rows.append({
            "day": f"Day -{i}",
            "date": d.isoformat(),
            "on_duty_h": round(avg, 1),
            "is_today": False,
        })

    # Today's row — duty added by this trip (cumulative; will be split per-day
    # by the caller if multi-day; here we just report the running total)
    rows.append({
        "day": "Today",
        "date": today.isoformat(),
        "on_duty_h": round(trip_duty_min / 60.0, 1),
        "is_today": True,
    })

    cycle_today = trip_duty_min / 60.0
    total_used = cycle_used_hours + cycle_today
    available = max(0.0, 70.0 - total_used)
    return {
        "cycle_limit_h": 70,
        "cycle_window_days": 8,
        "today_on_duty_h": round(cycle_today, 1),
        "total_used_h": round(total_used, 1),
        "available_tomorrow_h": round(available, 1),
        "rows": rows,
    }


def build_daily_logs(
    schedule: ScheduleResult,
    cycle_used_hours: float,
    driver_profile: Optional[Dict] = None,
) -> List[Dict]:
    """
    Convert a ScheduleResult into a list of daily log sheet objects,
    one per calendar day touched by the trip.
    """
    profile = {**DEFAULT_DRIVER, **(driver_profile or {})}

    # Split every event at midnight, then group by date
    all_segments: List[Dict] = []
    for ev in schedule.events:
        all_segments.extend(_split_event_at_midnight(ev))

    # Group by date
    by_date: Dict[str, List[Dict]] = {}
    for s in all_segments:
        by_date.setdefault(s["date"], []).append(s)

    # Build per-day log objects
    daily_logs: List[Dict] = []
    # Compute cumulative cycle usage per day for the recap
    running_cycle_min = cycle_used_hours * 60.0
    for d_str in sorted(by_date.keys()):
        segs = by_date[d_str]
        d_obj = date.fromisoformat(d_str)

        # Day-local totals
        totals = _compute_totals(segs)

        # Cumulative cycle including this day's duty (driving + on-duty)
        day_duty_min = totals["driving_h"] * 60 + totals["on_duty_h"] * 60
        running_cycle_min += day_duty_min

        # Per-day recap (today = this log's date)
        recap = _build_recap_for_day(running_cycle_min, day_duty_min, d_obj)

        # Header fields for the log
        # For multi-day trips, only the FINAL day shows the full recap with
        # today + 7 prior days. We'll show the same structure for each day.
        header = {
            "date": d_str,
            "from_time": "00:00",
            "to_time": "24:00",
            "driver_name": profile["driver_name"],
            "carrier_name": profile["carrier_name"],
            "main_office_address": profile["main_office_address"],
            "home_terminal_address": profile["home_terminal_address"],
            "truck_tractor": profile["truck_tractor"],
            "trailer": profile["trailer"],
            "co_driver": profile["co_driver"],
            "total_miles_today": totals["miles"],
            "shipping_docs": profile["shipping_docs"],
            "shipper_commodity": profile["shipper_commodity"],
            "cycle": "70hr / 8-Day",
        }

        daily_logs.append({
            "date": d_str,
            "header": header,
            "segments": segs,
            "totals": totals,
            "recap": recap,
            "remarks": [s["remark"] for s in segs],
        })

    return daily_logs


def _build_recap_for_day(running_cycle_min: float, day_duty_min: float, today: date) -> Dict:
    """Smaller per-day recap — full 8-day window."""
    today_h = day_duty_min / 60.0
    total_used_h = running_cycle_min / 60.0
    available_h = max(0.0, 70.0 - total_used_h)
    # Build a plausible 7-day prior history (we don't store historical trips,
    # so distribute the incoming cycle_used evenly across prior days)
    prior_total_h = max(0.0, total_used_h - today_h)
    avg_prior = prior_total_h / 7 if prior_total_h > 0 else 0
    rows = []
    for i in range(7, 0, -1):
        d = today - timedelta(days=i)
        rows.append({"day": f"Day -{i}", "date": d.isoformat(),
                     "on_duty_h": round(avg_prior, 1), "is_today": False})
    rows.append({
        "day": "Today", "date": today.isoformat(),
        "on_duty_h": round(today_h, 1), "is_today": True,
    })
    return {
        "cycle_limit_h": 70,
        "cycle_window_days": 8,
        "today_on_duty_h": round(today_h, 1),
        "total_used_h": round(total_used_h, 1),
        "available_tomorrow_h": round(available_h, 1),
        "rows": rows,
    }
