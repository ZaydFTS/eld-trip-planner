import { Truck, HelpCircle } from 'lucide-react'

interface Props {
  cycleHours: number   // current cycle used (out of 70)
  onLogoClick?: () => void
}

export default function TopAppBar({ cycleHours, onLogoClick }: Props) {
  const pct = Math.min(100, (cycleHours / 70) * 100)
  const cycleColor = pct < 50 ? 'bg-success' : pct < 80 ? 'bg-amber' : 'bg-warning'

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-8">
          <button
            onClick={onLogoClick}
            className="flex items-center gap-2.5 group"
            aria-label="ELD Trip Planner home"
          >
            <div className="w-9 h-9 rounded-btn bg-navy flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-1 rounded-full border-2 border-dashed border-amber/80" />
              <Truck className="w-5 h-5 text-white relative z-10" strokeWidth={1.75} />
            </div>
            <div className="leading-none">
              <div className="font-bold text-navy text-base tracking-tight">
                ELD<span className="text-muted font-medium">.TRIPPLANNER</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.05em] text-muted mt-0.5">
                FMCSA §395 Compliance Engine
              </div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink active>Route Planner</NavLink>
            <NavLink>HOS Logs</NavLink>
            <NavLink>FMCSA Compliance</NavLink>
            <NavLink>Manifest</NavLink>
          </nav>
        </div>

        {/* Right: cycle chip + help + avatar */}
        <div className="flex items-center gap-3">
          <div className="chip bg-canvas text-ink border border-border">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cycleColor}`} />
            <span className="tnum">70hr / 8-day cycle</span>
          </div>
          <button className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition">
            <HelpCircle className="w-3.5 h-3.5" /> How it works
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="text-right hidden sm:block leading-tight">
              <div className="text-xs font-semibold text-ink">James Carter</div>
              <div className="text-[10px] text-muted tnum">IL-TRK-4471</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function NavLink({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-btn text-xs font-medium transition ${
        active ? 'bg-steel-tint text-steel' : 'text-muted hover:text-ink hover:bg-canvas'
      }`}
    >
      {children}
    </button>
  )
}
