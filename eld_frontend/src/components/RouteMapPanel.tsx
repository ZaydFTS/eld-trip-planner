import { useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  MapPin, Warehouse, Flag, Coffee, Fuel as FuelIcon, Moon, Clock,
  CheckCircle2, Gauge, Zap,
} from 'lucide-react'
import type { TripPlan, ItineraryStop } from '../types'

interface Props {
  plan: TripPlan
}

// Build custom numbered marker icons for the 3 waypoints (origin / pickup / dropoff)
const NUMBERED_ICON = (n: number, color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:2px solid #fff;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

const STOPS_ICON = (kind: string) => {
  const colors: Record<string, string> = {
    break: '#1E3A8A',
    fuel: '#B45309',
    sleeper: '#475569',
  }
  const c = colors[kind] || '#0B2545'
  return L.divIcon({
    className: '',
    html: `<div style="background:${c};width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

export default function RouteMapPanel({ plan }: Props) {
  const { route, itinerary, summary } = plan

  // Convert OSRM [lon, lat] pairs to Leaflet [lat, lon]
  const latlngs = useMemo(
    () => (route.geometry || []).map(([lon, lat]) => [lat, lon] as [number, number]),
    [route],
  )

  // Map bounds fit
  const FitBounds = () => {
    const map = useMap()
    if (latlngs.length > 0) {
      const bounds = L.latLngBounds(latlngs as any)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
    return null
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-0 min-h-[600px]">
      {/* Itinerary sidebar */}
      <aside className="bg-white border-r border-border p-5 overflow-y-auto scroll-thin max-h-[80vh]">
        <div className="flex items-center justify-between mb-1">
          <span className="label-cap">Waypoint Sequence</span>
        </div>
        <h3 className="text-base font-bold text-navy mb-1">Stops & Rests Itinerary</h3>
        <div className="chip bg-steel-tint text-steel mb-5">
          {itinerary.length} Stops Total
        </div>

        {/* Timeline */}
        <ol className="relative pl-6">
          <div className="absolute left-[10px] top-2 bottom-2 w-px bg-border-strong" />
          {itinerary.map((stop, i) => (
            <ItineraryItem key={i} stop={stop} isLast={i === itinerary.length - 1} />
          ))}
        </ol>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="label-cap mb-2">Duty Status Legend</div>
          <div className="flex flex-col gap-1.5 text-xs">
            <LegendItem color="#0B2545" label="Driving" />
            <LegendItem color="#F59E0B" label="On-Duty (pickup/dropoff/fuel)" />
            <LegendItem color="#1E3A8A" label="Off-Duty (rest break)" />
            <LegendItem color="#475569" label="Sleeper Berth" />
          </div>
        </div>
      </aside>

      {/* Map + telemetry widget */}
      <div className="relative">
        <MapContainer
          center={[41.8, -87.6]}
          zoom={6}
          style={{ height: '80vh', minHeight: 600, width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={latlngs as any} pathOptions={{ color: '#0B2545', weight: 5, opacity: 0.85 }} />
          <Polyline positions={latlngs as any} pathOptions={{ color: '#F59E0B', weight: 2, opacity: 0.7 }} />

          {/* Waypoint markers */}
          {route.waypoints.map((w, i) => (
            <Marker
              key={i}
              position={[w.lat, w.lon]}
              icon={NUMBERED_ICON(i + 1, i === 0 ? '#0B2545' : i === route.waypoints.length - 1 ? '#0B2545' : '#F59E0B')}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-bold text-navy mb-0.5">{i === 0 ? 'Origin' : i === route.waypoints.length - 1 ? 'Destination' : 'Pickup'}</div>
                  <div className="text-muted">{w.display_name}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Intermediate stops (break/fuel/sleeper) — approximate position from itinerary time */}
          {itinerary
            .filter((s) => ['break', 'fuel', 'sleeper'].includes(s.kind))
            .map((stop, i) => {
              // Use the leg destination coordinates as a rough proxy
              const legIdx = Math.min(i + 1, route.waypoints.length - 1)
              const w = route.waypoints[legIdx]
              return (
                <Marker key={`s-${i}`} position={[w.lat + 0.02 * i, w.lon - 0.02 * i]} icon={STOPS_ICON(stop.kind)}>
                  <Popup>
                    <div className="text-xs">
                      <div className="font-bold text-navy mb-0.5">{stop.label}</div>
                      <div className="text-muted">{stop.title}</div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}

          <FitBounds />
        </MapContainer>

        {/* HOS Telemetry widget (overlay, bottom-right) */}
        <div className="absolute bottom-4 right-4 z-[1000] w-[280px] card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-navy">
              <Clock className="w-3.5 h-3.5" /> Driver HOS Telemetry
            </div>
            <span className="text-[10px] text-muted">US 49 CFR §395</span>
          </div>
          <Telemetry
            label="Driving Today"
            value={`${summary.driving_today_h.toFixed(1)}h / 11h`}
            remaining={`${summary.driving_today_remaining_h.toFixed(1)}h remaining`}
            used={summary.driving_today_h}
            limit={11}
            color="amber"
          />
          <Telemetry
            label="14h On-Duty Window"
            value={`${summary.duty_window_today_h.toFixed(1)}h / 14h`}
            remaining={`${summary.duty_window_remaining_h.toFixed(1)}h remaining`}
            used={summary.duty_window_today_h}
            limit={14}
            color="navy"
          />
          <Telemetry
            label="70h / 8-Day Cycle"
            value={`${summary.cycle_used_h.toFixed(1)}h / 70h`}
            remaining={`${summary.cycle_remaining_h.toFixed(1)}h available cycle`}
            used={summary.cycle_used_h}
            limit={70}
            color="amber"
          />
        </div>

        {/* Map stats (top-right) */}
        <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm border border-border rounded-btn px-3 py-2 text-[11px] flex items-center gap-3">
          <span className="flex items-center gap-1 text-muted">
            <Gauge className="w-3 h-3" /> Avg 53 mph
          </span>
          <span className="flex items-center gap-1 text-muted">
            <FuelIcon className="w-3 h-3" /> 6.8 mpg
          </span>
          <span className="flex items-center gap-1 text-success">
            <CheckCircle2 className="w-3 h-3" /> Clear
          </span>
        </div>
      </div>
    </div>
  )
}

function ItineraryItem({ stop, isLast }: { stop: ItineraryStop; isLast: boolean }) {
  const iconMap: Record<string, any> = {
    origin: MapPin, pickup: Warehouse, break: Coffee, fuel: FuelIcon, sleeper: Moon, destination: Flag,
  }
  const Icon = iconMap[stop.kind] || MapPin
  const colorMap: Record<string, string> = {
    origin: 'bg-navy text-white',
    pickup: 'bg-amber text-navy',
    break: 'bg-steel text-white',
    fuel: 'bg-amber-dark text-white',
    sleeper: 'bg-slate-500 text-white',
    destination: 'bg-navy text-white',
  }
  const badgeColor: Record<string, string> = {
    origin: 'bg-steel/10 text-steel',
    pickup: 'bg-amber/10 text-amber-dark',
    break: 'bg-steel/10 text-steel',
    fuel: 'bg-amber-dark/10 text-amber-dark',
    sleeper: 'bg-slate-100 text-slate-600',
    destination: 'bg-navy/10 text-navy',
  }
  return (
    <li className="relative mb-4 last:mb-0">
      <div className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${colorMap[stop.kind]}`}>
        {stop.kind === 'destination' ? <Flag className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
      </div>
      <div className="ml-2">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold tnum text-navy">
            {stop.time ? formatTime(stop.time) :
             stop.time_start && stop.time_end ? `${formatTime(stop.time_start)} – ${formatTime(stop.time_end)}` : ''}
          </span>
          <span className={`chip ${badgeColor[stop.kind]}`}>{stop.label}</span>
        </div>
        <div className="text-sm font-semibold text-ink">{stop.title}</div>
        <div className="text-xs text-muted leading-snug">{stop.subtitle}</div>
        {stop.duration_min && stop.duration_min > 0 && (
          <div className="text-[10px] text-muted tnum mt-1">{(stop.duration_min / 60).toFixed(1)}h dwell</div>
        )}
      </div>
    </li>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className="text-ink">{label}</span>
    </div>
  )
}

function Telemetry({
  label, value, remaining, used, limit, color,
}: {
  label: string
  value: string
  remaining: string
  used: number
  limit: number
  color: 'amber' | 'navy'
}) {
  const pct = Math.min(100, (used / limit) * 100)
  const fillColor = color === 'amber' ? 'bg-amber' : 'bg-navy'
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-ink">{label}</span>
        <span className="text-[11px] font-semibold text-ink tnum">{value}</span>
      </div>
      <div className="h-1.5 bg-canvas rounded-full overflow-hidden mb-0.5">
        <div className={`h-full ${fillColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-muted tnum">{remaining}</div>
    </div>
  )
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}
