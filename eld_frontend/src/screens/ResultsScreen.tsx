import { useState } from 'react'
import { Truck, ChevronLeft, Download, Map as MapIcon, FileText, Ruler, Clock, CalendarDays, CheckCircle2, TriangleAlert } from 'lucide-react'
import type { TripPlan } from '../types'
import RouteMapPanel from '../components/RouteMapPanel'
import DailyLogsPanel from '../components/DailyLogsPanel'
import { ComplianceBanner } from '../components/Banners'

interface Props {
  plan: TripPlan
  onBack: () => void
}

type Tab = 'map' | 'logs'

export default function ResultsScreen({ plan, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('map')
  const { route, summary, itinerary, driver, trip_inputs } = plan
  const routeTitle = `${trip_inputs.current_location} → ${trip_inputs.pickup_location} → ${trip_inputs.dropoff_location}`

  return (
    <div>
      {/* Trip summary header band */}
      <div className="bg-navy text-white">
        <div className="px-6 py-3 flex items-center justify-between text-[10px] uppercase tracking-[0.05em] text-navy-light/80">
          <span className="tnum">Trip Manifest · {new Date(trip_inputs.start_dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ELD-ID #99420-IL</span>
          <button onClick={onBack} className="flex items-center gap-1 hover:text-white/90 transition">
            <ChevronLeft className="w-3 h-3" /> New trip
          </button>
        </div>
        <div className="px-6 pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-amber flex-shrink-0" />
            <h2 className="text-lg md:text-xl font-bold tracking-tight">{routeTitle}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Kpi icon={Ruler} label="Distance" value={`${route.total_distance_mi.toFixed(0)} mi`} />
            <Kpi icon={Clock} label="Est. Driving" value={`${summary.driving_today_h.toFixed(1)}h`} />
            <Kpi icon={CalendarDays} label="Logs" value={`${summary.num_days} Day${summary.num_days > 1 ? 's' : ''}`} />
            <div className={`chip ${summary.compliant ? 'bg-success text-white' : 'bg-amber text-navy'}`}>
              {summary.compliant ? <CheckCircle2 className="w-3.5 h-3.5" /> : <TriangleAlert className="w-3.5 h-3.5" />}
              {summary.compliant ? 'Compliant' : 'Review'}
            </div>
            <button className="btn-ghost !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 !h-8 !px-3 !text-xs">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Compliance alerts */}
      {summary.alerts.length > 0 && (
        <ComplianceBanner
          kind={summary.compliant ? 'info' : 'warning'}
          message={summary.alerts.join(' · ')}
        />
      )}

      {/* Tab switcher */}
      <div className="bg-white border-b border-border px-6">
        <div className="flex gap-1">
          <TabButton active={tab === 'map'} onClick={() => setTab('map')} icon={MapIcon}>
            Route Map
          </TabButton>
          <TabButton active={tab === 'logs'} onClick={() => setTab('logs')} icon={FileText}>
            Daily Logs
          </TabButton>
        </div>
      </div>

      {/* Tab content */}
      <div className="bg-canvas">
        {tab === 'map' && <RouteMapPanel plan={plan} />}
        {tab === 'logs' && <DailyLogsPanel plan={plan} />}
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-white/60" />
      <span className="text-white/60 uppercase tracking-wide text-[10px]">{label}:</span>
      <span className="font-semibold text-white tnum">{value}</span>
    </div>
  )
}

function TabButton({
  active, onClick, icon: Icon, children,
}: {
  active: boolean
  onClick: () => void
  icon: any
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
        active
          ? 'border-amber text-navy'
          : 'border-transparent text-muted hover:text-ink'
      }`}
    >
      <Icon className="w-4 h-4" /> {children}
    </button>
  )
}
