"""
HOS (Hours of Service) constants per FMCSA 49 CFR Part 395.
Property-carrying CMV driver, 70hr/8-day cycle, no adverse driving conditions.
"""

# Duty statuses
STATUS_OFF_DUTY = "OFF"      # Off Duty
STATUS_SLEEPER = "SB"        # Sleeper Berth
STATUS_DRIVING = "D"         # Driving
STATUS_ON_DUTY = "ON"        # On Duty (not driving)

ALL_STATUSES = [STATUS_OFF_DUTY, STATUS_SLEEPER, STATUS_DRIVING, STATUS_ON_DUTY]

# FMCSA HOS limits (minutes)
DRIVE_LIMIT_MIN = 11 * 60          # 11-hour driving limit (since last 10+ hr off)
DUTY_WINDOW_MIN = 14 * 60          # 14-hour duty window (since last 10+ hr off)
REST_BREAK_THRESHOLD_MIN = 8 * 60  # Cumulative driving that triggers a 30-min break
REST_BREAK_MIN = 30                # 30-minute rest break duration
SLEEPER_RESET_MIN = 10 * 60        # 10-hour off-duty/sleeper to reset drive & window
CYCLE_LIMIT_MIN = 70 * 60          # 70-hour / 8-day cycle ceiling
CYCLE_RESTART_MIN = 34 * 60        # 34-hour restart (optional; not auto-applied here)

# Operational assumptions (DOCX)
FUEL_INTERVAL_MI = 1000            # Fuel at least once every 1,000 miles
FUEL_STOP_MIN = 15                 # Fuel stop duration (on-duty)
PICKUP_DWELL_MIN = 60              # 1 hour pickup
DROPOFF_DWELL_MIN = 60             # 1 hour dropoff
PRE_TRIP_MIN = 15                  # Pre-trip inspection (on-duty)
POST_TRIP_MIN = 15                 # Post-trip inspection (on-duty)

# Conversion
METERS_PER_MILE = 1609.344
SECS_PER_MIN = 60
