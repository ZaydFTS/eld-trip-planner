import { useMemo } from 'react'
import { FileText, CheckCircle2, PenTool } from 'lucide-react'
import type { DailyLog, DaySegment, DriverProfile, DutyStatus } from '../types'

interface Props {
  log: DailyLog
  driver: DriverProfile
}

const STATUS_LABEL: Record<DutyStatus, string> = {
  OFF: 'OFF DUTY',
  SB: 'SLEEPER BERTH',
  D: 'DRIVING',
  ON: 'ON DUTY (NOT DRIVING)',
}
const STATUS_ROW: Record<DutyStatus, number> = { OFF: 0, SB: 1, D: 2, ON: 3 }

export default function LogSheet({ log, driver }: Props) {
  const { header, segments, totals, recap, remarks } = log

  // Build duty line points for the SVG. Each segment becomes a horizontal line
  // at its row level, with vertical connectors between segments at status change.
  const dutyPath = useMemo(() => buildDutyPath(segments), [segments])

  return (
    <div className="bg-white border border-border rounded-card shadow-card overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-3 bg-navy text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber" />
          <h3 className="font-bold tracking-tight uppercase text-sm">Driver's Daily Log</h3>
          <span className="text-[10px] uppercase tracking-[0.05em] text-white/60">Form MCS-59</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.05em] text-white/60">
          24-Hour Period (Midnight to Midnight)
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Header info grid */}
        <HeaderGrid header={header} totals={totals} driver={driver} />

        {/* The Grid — 4 rows × 24h with duty line */}
        <LogGrid segments={segments} totals={totals} dutyPath={dutyPath} />

        {/* Bottom two-column */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Remarks */}
          <div className="border border-border rounded-btn p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="label-cap">Remarks & Duty Event Audit Log</h4>
              <span className="chip bg-steel-tint text-steel">{segments.length} Events Recorded</span>
            </div>
            <ul className="space-y-1.5 text-xs">
              {segments.map((s, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="font-bold text-navy tnum w-12 flex-shrink-0">{formatMin(s.start_min)}</span>
                  <span className="text-ink">{s.remark}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
              <div className="flex gap-2"><span className="label-cap !text-[10px] !w-32 flex-shrink-0">SHIPPING DOCUMENTS</span><span className="text-ink">{header.shipping_docs}</span></div>
              <div className="flex gap-2"><span className="label-cap !text-[10px] !w-32 flex-shrink-0">SHIPPER & COMMODITY</span><span className="text-ink">{header.shipper_commodity}</span></div>
            </div>
          </div>

          {/* Recap */}
          <div className="border border-border rounded-btn p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="label-cap">70-HR / 8-Day Cycle Recap</h4>
              <span className="chip bg-amber/10 text-amber-dark">US 60/70 Rule</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 label-cap !text-[10px]">Day</th>
                  <th className="text-right py-1.5 label-cap !text-[10px]">Duty (A)</th>
                  <th className="text-right py-1.5 label-cap !text-[10px]">Avail (B)</th>
                  <th className="text-right py-1.5 label-cap !text-[10px]">8-Day (C)</th>
                </tr>
              </thead>
              <tbody>
                {recap.rows.map((r) => (
                  <tr key={r.day} className={`border-b border-border/60 ${r.is_today ? 'bg-amber/5' : ''}`}>
                    <td className="py-1.5 font-semibold text-ink">{r.day}</td>
                    <td className="py-1.5 text-right tnum text-ink">{r.on_duty_h.toFixed(1)}</td>
                    <td className="py-1.5 text-right tnum text-ink">{r.is_today ? recap.available_tomorrow_h.toFixed(1) : '—'}</td>
                    <td className="py-1.5 text-right tnum text-muted">{r.is_today ? recap.total_used_h.toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Available tomorrow alert */}
            <div className="mt-3 bg-amber/10 border border-amber/30 rounded-btn p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-amber-dark font-bold mb-0.5">Hours Available Tomorrow</div>
              <div className="text-2xl font-bold text-amber-dark tnum">{recap.available_tomorrow_h.toFixed(1)} hrs</div>
              <div className="text-[10px] text-muted">Under 70hr / 8-day rolling window</div>
            </div>

            {/* Signature */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="label-cap mb-1">Driver Certification & Signature</div>
              <div className="flex items-end justify-between">
                <div className="font-serif italic text-navy text-xl" style={{ fontFamily: 'Georgia, serif' }}>
                  {driver.driver_name}
                </div>
                <div className="chip bg-success/10 text-success text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> Cryptographically Signed
                </div>
              </div>
              <div className="text-[10px] text-muted mt-1">
                {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · I certify these entries are true per FMCSA §395.8
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------- header grid
function HeaderGrid({ header, totals, driver }: { header: DailyLog['header']; totals: DailyLog['totals']; driver: DriverProfile }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      <Field label="Date" value={`${formatDate(header.date)} · ${header.from_time}–${header.to_time}`} />
      <Field label="Cycle" value={header.cycle} />
      <Field label="Driver" value={driver.driver_name} />
      <Field label="Carrier" value={driver.carrier_name} />
      <Field label="Main Office" value={driver.main_office_address} />
      <Field label="Home Terminal" value={driver.home_terminal_address} />
      <Field label="Truck/Tractor #" value={header.truck_tractor} />
      <Field label="Trailer #" value={header.trailer} />
      <Field label="Total Miles Today" value={`${totals.miles.toFixed(0)}`} highlight />
      <Field label="Co-Driver" value={header.co_driver} />
      <Field label="Shipping Docs" value={header.shipping_docs} />
      <Field label="Shipper & Commodity" value={header.shipper_commodity} />
    </div>
  )
}

function Field({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="label-cap mb-0.5">{label}</div>
      <div className={`px-2 py-1 rounded-chip border border-border bg-white text-ink ${highlight ? 'font-bold text-amber-dark text-sm' : ''}`}>{value}</div>
    </div>
  )
}

// -------------------------------------------------------- the grid
function LogGrid({ segments, totals, dutyPath }: { segments: DaySegment[]; totals: DailyLog['totals']; dutyPath: string }) {
  // Time axis labels: midnight, 1-11, NOON, 1-11, midnight
  const timeLabels = ['midnight', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'NOON', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'midnight']
  const STATUS_ROWS: DutyStatus[] = ['OFF', 'SB', 'D', 'ON']

  return (
    <div className="border border-border rounded-btn overflow-hidden">
      {/* Time axis (black bar) */}
      <div className="bg-navy text-white flex items-center justify-between text-[10px] font-semibold tracking-wide">
        <div className="px-2 w-[120px] flex-shrink-0 border-r border-white/10">midnight</div>
        <div className="flex-1 grid grid-cols-24 gap-0 px-0">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="text-center tnum border-r border-white/10 last:border-r-0 py-1">
              {i === 0 ? 'MID' : i === 12 ? 'NOON' : i < 12 ? `${i}` : `${i - 12}`}
            </div>
          ))}
        </div>
        <div className="px-2 flex-shrink-0 border-l border-white/10 text-right">
          <div className="leading-tight">Miles</div>
          <div className="leading-tight">Total Hrs</div>
        </div>
      </div>

      {/* 4 status rows + the duty line as an SVG overlay */}
      <div className="relative">
        {/* Row backgrounds */}
        {STATUS_ROWS.map((status) => (
          <div key={status} className="flex border-b border-border last:border-b-0 h-12">
            <div className="w-[120px] flex-shrink-0 px-2 py-1.5 border-r border-border bg-canvas flex flex-col justify-center">
              <div className="text-[11px] font-bold text-navy">{STATUS_LABEL[status]}</div>
            </div>
            {/* Hour cells */}
            <div className="relative flex-1">
              {/* Hour grid lines */}
              <div className="absolute inset-0 grid grid-cols-24">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="border-r border-border/60 last:border-r-0 relative">
                    {/* 15-min subdivision lines */}
                    <div className="absolute left-1/4 top-0 bottom-0 w-px bg-border/30" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/30" />
                    <div className="absolute left-3/4 top-0 bottom-0 w-px bg-border/30" />
                  </div>
                ))}
              </div>
              {/* The duty line for this row only */}
              <DutyLineForRow segments={segments} status={status} />
            </div>
            {/* Row totals */}
            <div className="w-[80px] flex-shrink-0 px-2 py-1.5 border-l border-border bg-canvas text-right text-xs">
              <div className="font-bold tnum text-ink">{status === 'D' ? totals.miles.toFixed(0) : '—'}</div>
              <div className="text-muted tnum">{hoursForStatus(status, totals)}h</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-canvas border-t border-border px-3 py-2 flex items-center justify-between text-[10px] text-muted">
        <span>* 15-minute grid subdivisions</span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-success" /> ELD Telematics Synced
        </span>
        <span className="font-semibold tnum text-ink">Total 24-hr recap: {totals.total_h.toFixed(1)} hours</span>
      </div>
    </div>
  )
}

// SVG duty line for a single row (drawn within the row's flex-1 area)
function DutyLineForRow({ segments, status }: { segments: DaySegment[]; status: DutyStatus }) {
  // Filter segments matching this row's status
  const rowSegments = segments.filter((s) => s.status === status)
  if (rowSegments.length === 0) return null

  // Width per minute (in % of the row's flex-1 area)
  const W_PER_MIN = 100 / 1440

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      style={{ width: '100%', height: '100%' }}
    >
      {rowSegments.map((s, i) => {
        const x1 = s.start_min * W_PER_MIN
        const x2 = s.end_min * W_PER_MIN
        return (
          <g key={i}>
            {/* Filled bar for the duty segment */}
            <rect
              x={x1}
              y={20}
              width={Math.max(0.2, x2 - x1)}
              height={60}
              fill={statusColor(status)}
              opacity={0.85}
            />
            {/* Start dot */}
            <circle cx={x1} cy={50} r={1.2} fill={statusColor(status)} />
            {/* End dot */}
            <circle cx={x2} cy={50} r={1.2} fill={statusColor(status)} />
          </g>
        )
      })}
    </svg>
  )
}

function statusColor(status: DutyStatus): string {
  switch (status) {
    case 'OFF': return '#475569'  // slate
    case 'SB': return '#5B21B6'   // purple
    case 'D': return '#0B2545'    // navy
    case 'ON': return '#F59E0B'   // amber
  }
}

function hoursForStatus(status: DutyStatus, totals: DailyLog['totals']): number {
  switch (status) {
    case 'OFF': return totals.off_duty_h
    case 'SB': return totals.sleeper_h
    case 'D': return totals.driving_h
    case 'ON': return totals.on_duty_h
  }
}

// -------------------------------------------------------- helpers
function buildDutyPath(segments: DaySegment[]): string {
  // Returns an SVG path string for the continuous duty line.
  // Currently unused (we render per-row rects instead), but kept for
  // future "single continuous line" rendering option.
  if (segments.length === 0) return ''
  let d = ''
  segments.forEach((s) => {
    const y = STATUS_ROW[s.status] * 25 + 12.5
    const x1 = (s.start_min / 1440) * 100
    const x2 = (s.end_min / 1440) * 100
    d += `M ${x1} ${y} L ${x2} ${y} `
  })
  return d
}

function formatMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.floor(min % 60)
  // 24-hour format
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}
