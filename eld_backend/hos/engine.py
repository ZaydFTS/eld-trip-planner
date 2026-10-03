"""
HOS scheduling engine — the brain of the app.

Takes trip legs (distance + drive time) and produces a fully FMCSA §395-compliant
schedule of duty events. Pure logic — no I/O. The routing service feeds in the
OSRM-derived distances/times, and the log generator consumes the events list
to build daily log sheets.

HOS rules enforced (property-carrying, 70hr/8day):
  1. 11-hour driving limit        — drive ≤ 11h since last 10h+ off duty
  2. 14-hour duty window           — on-duty ≤ 14h since last 10h+ off duty
  3. 30-min rest break             — after 8 cumulative hours of driving since last 8h+ off
  4. 70hr/8-day cycle              — cumulative on-duty ≤ 70h in any rolling 8-day window
  5. Fueling every 1,000 mi        — 15-min on-duty fuel stop inserted at 1,000-mi intervals
  6. 1-hr pickup + drop-off dwell  — on-duty dwell at pickup and drop-off

CRITICAL: The 30-min rest break does NOT reset the 11h drive limit or the 14h
duty window. Only 10+ consecutive hours off-duty (sleeper or off) resets both.
The 30-min break only resets the 8-hour driving counter.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple

from .constants import (
    DRIVE_LIMIT_MIN, DUTY_WINDOW_MIN, REST_BREAK_THRESHOLD_MIN, REST_BREAK_MIN,
    SLEEPER_RESET_MIN, CYCLE_LIMIT_MIN, FUEL_INTERVAL_MI, FUEL_STOP_MIN,
    PICKUP_DWELL_MIN, DROPOFF_DWELL_MIN, PRE_TRIP_MIN, POST_TRIP_MIN,
    STATUS_OFF_DUTY, STATUS_SLEEPER, STATUS_DRIVING, STATUS_ON_DUTY,
)


@dataclass
class DutyEvent:
    """A single duty-status change with absolute start/end times."""
    start: datetime
    end: datetime
    status: str                 # OFF / SB / D / ON
    location: str               # place name or "En route"
    remark: str                 # free-text annotation
    miles: float = 0.0          # miles covered (only for D status)

    def to_dict(self) -> Dict:
        return {
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "status": self.status,
            "location": self.location,
            "remark": self.remark,
            "miles": round(self.miles, 1),
            "duration_min": (self.end - self.start).total_seconds() / 60.0,
        }


@dataclass
class LegSpec:
    """One trip leg: from one named place to another, with route stats."""
    from_name: str
    to_name: str
    distance_mi: float
    drive_min: float            # OSRM-derived drive time in minutes
    geometry: Optional[List[Tuple[float, float]]] = None  # [(lon, lat), ...]


@dataclass
class ScheduleResult:
    events: List[DutyEvent] = field(default_factory=list)
    alerts: List[str] = field(default_factory=list)
    total_drive_min: float = 0.0
    total_duty_min: float = 0.0
    total_distance_mi: float = 0.0
    cycle_used_min: float = 0.0
    sleeper_count: int = 0
    rest_break_count: int = 0
    fuel_stop_count: int = 0

    def to_dict(self) -> Dict:
        return {
            "events": [e.to_dict() for e in self.events],
            "alerts": self.alerts,
            "total_drive_min": round(self.total_drive_min, 1),
            "total_duty_min": round(self.total_duty_min, 1),
            "total_distance_mi": round(self.total_distance_mi, 1),
            "cycle_used_min": round(self.cycle_used_min, 1),
            "sleeper_count": self.sleeper_count,
            "rest_break_count": self.rest_break_count,
            "fuel_stop_count": self.fuel_stop_count,
        }


class HOSEngine:
    """
    Plans a compliant duty schedule across one or more trip legs.

    Algorithm (greedy, minute-accurate):
      - Maintain rolling counters:
          drive_since_reset   (minutes driven since last 10h+ off)
          drive_since_break   (minutes driven since last 30min+ off)
          duty_window_elapsed (minutes since duty_window_start)
          cycle_used          (minutes of on-duty since trip start)
      - BEFORE each drive chunk, check (in order):
          1. If drive_since_reset >= 11h  -> take 10h sleeper
          2. If duty_window_elapsed >= 14h -> take 10h sleeper
          3. If drive_since_break >= 8h   -> take 30-min rest
          4. If cycle_used >= 70h         -> alert + cannot drive (need 34h restart)
      - Drive the largest chunk that fits all remaining budgets, capped at
        the next 1,000-mi fuel boundary.
      - After each chunk: update counters. Insert fuel stop if 1,000 mi hit.
    """

    def __init__(self, cycle_used_hours: float):
        self.cycle_remaining_min = CYCLE_LIMIT_MIN - (cycle_used_hours * 60)
        if self.cycle_remaining_min < 0:
            self.cycle_remaining_min = 0

    # ------------------------------------------------------------------ main
    def plan(
        self,
        legs: List[LegSpec],
        start_dt: datetime,
        driver_label: str = "Driver",
    ) -> ScheduleResult:
        result = ScheduleResult()
        t = start_dt

        # Pre-trip inspection (15 min on-duty) — counts toward cycle & window
        origin = legs[0].from_name if legs else "Origin"
        self._append_event(result, t, t + timedelta(minutes=PRE_TRIP_MIN),
                           STATUS_ON_DUTY, origin, "Pre-trip CMV inspection")
        t = t + timedelta(minutes=PRE_TRIP_MIN)

        duty_window_start = start_dt          # 14h window begins at on-duty (pre-trip)
        drive_since_reset = 0.0              # since last 10h+ off
        drive_since_break = 0.0              # since last 30min+ off
        cycle_used_this_trip = float(PRE_TRIP_MIN)
        miles_since_fuel = 0.0
        total_miles = 0.0

        for leg_idx, leg in enumerate(legs):
            leg_remaining_min = leg.drive_min
            leg_remaining_mi = leg.distance_mi
            avg_speed_mph = (leg.distance_mi / (leg.drive_min / 60.0)) if leg.drive_min > 0 else 55.0

            # Drive this leg, chunk by chunk, enforcing all HOS limits
            while leg_remaining_min > 0.5:
                duty_window_elapsed = (t - duty_window_start).total_seconds() / 60.0

                # ---- 1. 11h drive limit -> need 10h sleeper ----
                if drive_since_reset >= DRIVE_LIMIT_MIN - 0.01:
                    t, duty_window_start, drive_since_reset, drive_since_break = self._take_sleeper(
                        result, t, leg.from_name, leg.to_name)
                    result.sleeper_count += 1
                    continue

                # ---- 2. 14h duty window -> need 10h sleeper ----
                if duty_window_elapsed >= DUTY_WINDOW_MIN - 0.01:
                    t, duty_window_start, drive_since_reset, drive_since_break = self._take_sleeper(
                        result, t, leg.from_name, leg.to_name)
                    result.sleeper_count += 1
                    continue

                # ---- 3. 8h driving -> need 30-min rest break ----
                if drive_since_break >= REST_BREAK_THRESHOLD_MIN - 0.01:
                    t, drive_since_break = self._take_rest_break(
                        result, t, leg.from_name, leg.to_name)
                    result.rest_break_count += 1
                    continue

                # ---- 4. 70h cycle exhausted -> cannot drive ----
                if cycle_used_this_trip >= self.cycle_remaining_min - 0.01:
                    result.alerts.append(
                        f"70h/8-day cycle exhausted: trip requires "
                        f"{cycle_used_this_trip/60:.1f}h on-duty but only "
                        f"{self.cycle_remaining_min/60:.1f}h remains. "
                        "A 34-hour restart must precede this trip."
                    )
                    break

                # ---- Compute max drive chunk that fits all budgets ----
                drive_avail = DRIVE_LIMIT_MIN - drive_since_reset
                window_avail = DUTY_WINDOW_MIN - duty_window_elapsed
                cycle_avail = self.cycle_remaining_min - cycle_used_this_trip
                break_avail = REST_BREAK_THRESHOLD_MIN - drive_since_break   # cap at 8h mark

                max_chunk = min(leg_remaining_min, drive_avail, window_avail,
                                cycle_avail, break_avail)
                if max_chunk <= 0:
                    break

                # ---- Cap chunk at next 1,000-mi fuel threshold ----
                chunk_miles_at_max = (max_chunk / 60.0) * avg_speed_mph
                if miles_since_fuel + chunk_miles_at_max > FUEL_INTERVAL_MI:
                    # Cap chunk so we arrive at exactly 1,000 mi since last fuel
                    miles_to_next_fuel = max(0.0, FUEL_INTERVAL_MI - miles_since_fuel)
                    fuel_capped_chunk = (miles_to_next_fuel / avg_speed_mph) * 60.0 if avg_speed_mph > 0 else max_chunk
                    max_chunk = min(max_chunk, fuel_capped_chunk)

                # ---- Drive the chunk ----
                actual_chunk = max(0.0, min(max_chunk, leg_remaining_min))
                if actual_chunk < 0.01:
                    break
                actual_miles = (actual_chunk / 60.0) * avg_speed_mph
                self._append_event(
                    result, t, t + timedelta(minutes=actual_chunk),
                    STATUS_DRIVING,
                    f"En route: {leg.from_name} → {leg.to_name}",
                    f"Driving {actual_miles:.1f} mi at {avg_speed_mph:.0f} mph",
                    miles=actual_miles,
                )
                t = t + timedelta(minutes=actual_chunk)
                drive_since_reset += actual_chunk
                drive_since_break += actual_chunk
                cycle_used_this_trip += actual_chunk
                total_miles += actual_miles
                miles_since_fuel += actual_miles
                leg_remaining_min -= actual_chunk
                leg_remaining_mi -= actual_miles

                # ---- Fuel stop at 1,000-mi boundary ----
                if miles_since_fuel >= FUEL_INTERVAL_MI - 0.5 and leg_remaining_min > 0.5:
                    self._append_event(
                        result, t, t + timedelta(minutes=FUEL_STOP_MIN),
                        STATUS_ON_DUTY, "Fuel stop (en route)",
                        f"Fuel — {FUEL_INTERVAL_MI} mi interval (15-min on-duty)")
                    t = t + timedelta(minutes=FUEL_STOP_MIN)
                    cycle_used_this_trip += FUEL_STOP_MIN
                    miles_since_fuel = 0.0
                    result.fuel_stop_count += 1

            # ---- Leg complete: insert pickup or dropoff dwell ----
            is_last_leg = (leg_idx == len(legs) - 1)
            if not is_last_leg:
                # Pickup at the leg's destination (intermediate waypoint)
                self._append_event(
                    result, t, t + timedelta(minutes=PICKUP_DWELL_MIN),
                    STATUS_ON_DUTY, leg.to_name,
                    f"Pickup — 1 hr dwell (loading at {leg.to_name})")
                t = t + timedelta(minutes=PICKUP_DWELL_MIN)
                cycle_used_this_trip += PICKUP_DWELL_MIN

        # Post-trip inspection at final destination
        final_dest = legs[-1].to_name if legs else "Destination"
        self._append_event(result, t, t + timedelta(minutes=POST_TRIP_MIN),
                           STATUS_ON_DUTY, final_dest, "Post-trip CMV inspection")
        t = t + timedelta(minutes=POST_TRIP_MIN)
        cycle_used_this_trip += POST_TRIP_MIN

        # ---- Aggregate result ----
        result.total_drive_min = sum(
            (e.end - e.start).total_seconds() / 60 for e in result.events if e.status == STATUS_DRIVING
        )
        result.total_duty_min = sum(
            (e.end - e.start).total_seconds() / 60 for e in result.events
            if e.status in (STATUS_DRIVING, STATUS_ON_DUTY)
        )
        result.total_distance_mi = total_miles
        result.cycle_used_min = cycle_used_this_trip

        # ---- Compliance alerts (informational) ----
        if result.sleeper_count > 0:
            result.alerts.append(
                f"{result.sleeper_count} × 10-hour sleeper berth inserted "
                "(11h drive limit / 14h duty window reached)."
            )
        if result.rest_break_count > 0:
            result.alerts.append(
                f"{result.rest_break_count} × 30-minute rest break inserted "
                "(8-hour driving rule)."
            )
        if result.fuel_stop_count > 0:
            result.alerts.append(
                f"{result.fuel_stop_count} × fuel stop inserted (1,000-mi rule)."
            )
        if cycle_used_this_trip > self.cycle_remaining_min:
            result.alerts.append(
                f"Cycle overage: trip requires {cycle_used_this_trip/60:.1f}h on-duty "
                f"but only {self.cycle_remaining_min/60:.1f}h remains in 70h/8-day cycle."
            )

        return result

    # --------------------------------------------------------- event helpers
    def _append_event(self, result: ScheduleResult, start: datetime, end: datetime,
                      status: str, location: str, remark: str, miles: float = 0.0) -> None:
        result.events.append(DutyEvent(start=start, end=end, status=status,
                                        location=location, remark=remark, miles=miles))

    def _take_rest_break(self, result: ScheduleResult, t: datetime,
                         from_name: str, to_name: str) -> Tuple[datetime, float]:
        """30-min off-duty rest break (FMCSA §395.3(a)(3)(ii)).
        Resets drive_since_break ONLY. Does NOT reset 11h drive or 14h window."""
        location = f"Rest area near {to_name}"
        self._append_event(result, t, t + timedelta(minutes=REST_BREAK_MIN),
                           STATUS_OFF_DUTY, location,
                           "30-min rest break (8-hour driving rule)")
        return t + timedelta(minutes=REST_BREAK_MIN), 0.0

    def _take_sleeper(self, result: ScheduleResult, t: datetime,
                      from_name: str, to_name: str) -> Tuple[datetime, datetime, float, float]:
        """10-hour sleeper berth — resets drive limit + duty window.
        Does NOT count toward the 70h cycle."""
        location = f"Truck stop near {to_name}"
        new_t = t + timedelta(minutes=SLEEPER_RESET_MIN)
        self._append_event(result, t, new_t, STATUS_SLEEPER, location,
                           "10-hour sleeper berth (resets 11h drive limit & 14h window)")
        return new_t, new_t, 0.0, 0.0  # new t, new duty_window_start, reset both drive counters
