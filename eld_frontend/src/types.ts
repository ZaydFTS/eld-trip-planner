/**
 * TypeScript types matching the backend response shape.
 * Mirrors the JSON returned by POST /api/plan.
 */

export type DutyStatus = 'OFF' | 'SB' | 'D' | 'ON'

export interface Waypoint {
  name: string
  lat: number
  lon: number
  display_name: string
}

export interface RouteLeg {
  from: string
  to: string
  distance_mi: number
  drive_min: number
}

export interface RouteInfo {
  total_distance_mi: number
  total_drive_min: number
  total_drive_h: number
  geometry: [number, number][]   // [lon, lat] pairs from OSRM GeoJSON
  legs: RouteLeg[]
  waypoints: Waypoint[]
}

export interface DutyEventDTO {
  start: string
  end: string
  status: DutyStatus
  location: string
  remark: string
  miles: number
  duration_min: number
}

export interface ScheduleDTO {
  events: DutyEventDTO[]
  alerts: string[]
  total_drive_min: number
  total_duty_min: number
  total_distance_mi: number
  cycle_used_min: number
  sleeper_count: number
  rest_break_count: number
  fuel_stop_count: number
}

export interface DaySegment {
  date: string
  start_min: number
  end_min: number
  status: DutyStatus
  location: string
  remark: string
  miles: number
}

export interface DayTotals {
  off_duty_h: number
  sleeper_h: number
  driving_h: number
  on_duty_h: number
  total_h: number
  miles: number
}

export interface RecapRow {
  day: string
  date: string
  on_duty_h: number
  is_today: boolean
}

export interface RecapDTO {
  cycle_limit_h: number
  cycle_window_days: number
  today_on_duty_h: number
  total_used_h: number
  available_tomorrow_h: number
  rows: RecapRow[]
}

export interface DailyLogHeader {
  date: string
  from_time: string
  to_time: string
  driver_name: string
  carrier_name: string
  main_office_address: string
  home_terminal_address: string
  truck_tractor: string
  trailer: string
  co_driver: string
  total_miles_today: number
  shipping_docs: string
  shipper_commodity: string
  cycle: string
}

export interface DailyLog {
  date: string
  header: DailyLogHeader
  segments: DaySegment[]
  totals: DayTotals
  recap: RecapDTO
  remarks: string[]
}

export interface ItineraryStop {
  kind: 'origin' | 'pickup' | 'break' | 'fuel' | 'sleeper' | 'destination'
  label: string
  title: string
  subtitle: string
  time?: string
  time_start?: string
  time_end?: string
  duration_min?: number
}

export interface DriverProfile {
  driver_name: string
  carrier_name: string
  main_office_address: string
  home_terminal_address: string
  truck_tractor: string
  trailer: string
  co_driver: string
  shipping_docs: string
  shipper_commodity: string
}

export interface TripSummary {
  compliant: boolean
  alerts: string[]
  num_days: number
  driving_today_h: number
  driving_today_remaining_h: number
  duty_window_today_h: number
  duty_window_remaining_h: number
  cycle_used_h: number
  cycle_remaining_h: number
  cycle_limit_h: number
}

export interface TripPlan {
  route: RouteInfo
  schedule: ScheduleDTO
  daily_logs: DailyLog[]
  summary: TripSummary
  itinerary: ItineraryStop[]
  driver: DriverProfile
  trip_inputs: {
    current_location: string
    pickup_location: string
    dropoff_location: string
    current_cycle_used_hours: number
    start_dt: string
  }
}

export interface SampleTrip {
  id: string
  name: string
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used_hours: number
  label: string
}
