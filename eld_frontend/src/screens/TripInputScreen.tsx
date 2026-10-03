import { useState } from 'react'
import { MapPin, Warehouse, Flag, Clock, RotateCcw, ArrowRight, Beaker, Truck, Fuel, Hourglass, CheckCircle2 } from 'lucide-react'
import type { SampleTrip } from '../types'

interface Props {
  samples: SampleTrip[]
  loading: boolean
  onPlan: (input: {
    current_location: string
    pickup_location: string
    dropoff_location: string
    current_cycle_used_hours: number
  }) => void
  onSample: (id: string) => void
}

export default function TripInputScreen({ samples, loading, onPlan, onSample }: Props) {
  const [currentLocation, setCurrentLocation] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [cycleUsed, setCycleUsed] = useState(35)

  const cyclePct = Math.min(100, (cycleUsed / 70) * 100)
  const cycleColor = cyclePct < 50 ? 'bg-success' : cyclePct < 80 ? 'bg-amber' : 'bg-warning'
  const cycleRemaining = (70 - cycleUsed).toFixed(1)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentLocation || !pickupLocation || !dropoffLocation) return
    onPlan({
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_used_hours: cycleUsed,
    })
  }

  const clear = () => {
    setCurrentLocation('')
    setPickupLocation('')
    setDropoffLocation('')
    setCycleUsed(35)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 chip bg-steel-tint text-steel mb-4">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
          US FMCSA 49 CFR §395 COMPLIANT
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-navy tracking-tight">Plan a compliant trip</h1>
        <p className="mt-3 text-muted text-sm md:text-base max-w-xl mx-auto">
          Enter your trip details. We'll route it on a live map and generate FMCSA daily log sheets
          automatically — fueling, breaks, sleeper berth, and HOS limits included.
        </p>
      </div>

      {/* Form card */}
      <form onSubmit={submit} className="card p-6 md:p-8 space-y-5">
        <Field label="Current location" icon={MapPin} hint="Origin checkpoint">
          <input
            type="text"
            className="input pl-9"
            placeholder="Chicago, IL (Terminal 4)"
            value={currentLocation}
            onChange={(e) => setCurrentLocation(e.target.value)}
            required
          />
          <MapPin className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </Field>

        <Field label="Pickup location" icon={Warehouse} hint="Pickup · 1 hr dwell" hintColor="steel">
          <input
            type="text"
            className="input pl-9"
            placeholder="Joliet, IL — Amazon MDW2"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            required
          />
          <Warehouse className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </Field>

        <Field label="Dropoff location" icon={Flag} hint="Dropoff · 1 hr dwell" hintColor="steel">
          <input
            type="text"
            className="input pl-9"
            placeholder="Detroit, MI — GM Assembly"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            required
          />
          <Flag className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </Field>

        {/* Cycle used — stepper + progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted" />
              Current Cycle Used (8-Day Window)
            </label>
            <span className="text-xs text-muted tnum">Hours already logged against 70h cap</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCycleUsed((v) => Math.max(0, +(v - 0.5).toFixed(1)))}
              className="w-9 h-9 rounded-btn border border-border-strong hover:bg-canvas text-lg text-muted"
              aria-label="Decrease cycle"
            >
              −
            </button>
            <div className="flex-1">
              <div className="flex items-baseline justify-center gap-2 mb-1">
                <span className="text-2xl font-bold text-navy tnum">{cycleUsed.toFixed(1)}</span>
                <span className="text-xs text-muted">/ 70.0 hrs</span>
              </div>
              <div className="h-2 bg-canvas rounded-full overflow-hidden">
                <div className={`h-full ${cycleColor} rounded-full transition-all`} style={{ width: `${cyclePct}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-[10px] uppercase tracking-wide text-muted tnum">
                <span>0h logged</span>
                <span className="text-amber-dark font-semibold">{cycleRemaining} hrs available this cycle ({(100 - cyclePct).toFixed(0)}% remaining)</span>
                <span>70h cap</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCycleUsed((v) => Math.min(70, +(v + 0.5).toFixed(1)))}
              className="w-9 h-9 rounded-btn border border-border-strong hover:bg-canvas text-lg text-muted"
              aria-label="Increase cycle"
            >
              +
            </button>
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={clear} className="btn-ghost">
            <RotateCcw className="w-4 h-4" /> Clear form
          </button>
          <button type="submit" disabled={loading} className="btn-amber">
            {loading ? (
              <><span className="inline-block w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" /> Generating…</>
            ) : (
              <>Generate route & logs <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </form>

      {/* Sample routes */}
      {samples.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.05em] text-muted flex items-center gap-2">
              <Beaker className="w-4 h-4" /> Try a sample route
            </h2>
            <span className="text-xs text-muted">Instant telematics benchmarks</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => onSample(s.id)}
                disabled={loading}
                className="card p-4 text-left hover:border-steel hover:shadow-overlay transition group disabled:opacity-50"
              >
                <div className="font-semibold text-navy text-sm mb-1 group-hover:text-steel transition">{s.name}</div>
                <div className="text-xs text-muted mb-2">
                  {s.current_location} → {s.dropoff_location}
                </div>
                <div className="text-[11px] text-muted tnum mb-3">{s.label}</div>
                <div className="flex items-center gap-1 text-amber-dark text-xs font-semibold">
                  Plan this route <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature highlights */}
      <div className="mt-10 bg-steel-tint/40 border border-steel/10 rounded-card p-6">
        <div className="grid sm:grid-cols-3 gap-6">
          <Feature
            icon={Truck}
            title="Property-Carrying CMV"
            desc="70hr / 8-day cycle with automatic 10hr sleeper berth resets and 34hr restart awareness."
          />
          <Feature
            icon={Fuel}
            title="Automated Refueling"
            desc="15-min on-duty fuel stop triggered every 1,000 miles — never miss the interval."
          />
          <Feature
            icon={Hourglass}
            title="Dwell Constraints"
            desc="1-hour pickup and drop-off dwell automatically scheduled. Pre-trip + post-trip inspections included."
          />
        </div>
        <div className="mt-5 pt-4 border-t border-steel/10 flex items-center gap-2 text-[11px] text-muted">
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          Assumes standard driving conditions — no adverse weather exceptions applied per FMCSA §395.1(b).
          Routing via OSRM · Map tiles © OpenStreetMap contributors.
        </div>
      </div>
    </div>
  )
}

function Field({
  label, icon: Icon, hint, hintColor = 'muted', children,
}: {
  label: string
  icon: any
  hint?: string
  hintColor?: 'muted' | 'steel'
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold text-ink flex items-center gap-1.5">
          <Icon className="w-4 h-4 text-muted" />
          {label}
        </label>
        {hint && (
          <span className={`text-[11px] font-semibold ${
            hintColor === 'steel' ? 'text-steel' : 'text-muted'
          }`}>
            {hint}
          </span>
        )}
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="w-9 h-9 rounded-btn bg-white border border-steel/15 flex items-center justify-center">
        <Icon className="w-4 h-4 text-steel" strokeWidth={1.75} />
      </div>
      <div className="text-sm font-semibold text-navy">{title}</div>
      <div className="text-xs text-muted leading-relaxed">{desc}</div>
    </div>
  )
}
