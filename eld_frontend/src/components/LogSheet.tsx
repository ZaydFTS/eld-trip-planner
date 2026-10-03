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
        <LogGrid segments={segments} totals={totals} />

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
const ROW_H = 48             // px height per status row
const ROW_COUNT = 4
const GRID_H = ROW_H * ROW_COUNT   // 192px
const STATUS_ROWS: DutyStatus[] = ['OFF', 'SB', 'D', 'ON']
const STATUS_Y: Record<DutyStatus, number> = { OFF: 24, SB: 72, D: 120, ON: 168 }

function LogGrid({ segments, totals }: { segments: DaySegment[]; totals: DailyLog['totals'] }) {
  // Build the continuous duty path (using absolute pixel coordinates so the
  // line stays crisp regardless of viewport width).
  // viewBox is 100 wide x GRID_H tall (192). X uses 0-100 scale.
  const pathData = useMemo(() => buildContinuousDutyPath(segments), [segments])

  return (
    <div className="border border-border rounded-btn overflow-hidden">
      {/* Time axis (navy bar) */}
      <div className="bg-navy text-white flex items-stretch text-[10px] font-semibold tracking-wide">
        <div className="px-2 w-[120px] flex-shrink-0 border-r border-white/10 flex items-center">midnight</div>
        <div className="flex-1 grid grid-cols-24 gap-0">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="text-center tnum border-r border-white/10 last:border-r-0 py-1 flex items-center justify-center">
              {i === 0 ? 'MID' : i === 12 ? 'NOON' : i < 12 ? `${i}` : `${i - 12}`}
            </div>
          ))}
        </div>
        <div className="px-2 w-[80px] flex-shrink-0 border-l border-white/10 text-right flex flex-col justify-center">
          <div className="leading-tight">Miles</div>
          <div className="leading-tight">Total Hrs</div>
        </div>
      </div>

      {/* Grid body: labels column + grid area + totals column */}
      <div className="flex">
        {/* Left labels column */}
        <div className="w-[120px] flex-shrink-0 border-r border-border bg-canvas">
          {STATUS_ROWS.map((status) => (
            <div key={status} className="h-12 px-2 py-1.5 border-b border-border last:border-b-0 flex flex-col justify-center">
              <div className="text-[10px] font-bold text-navy leading-tight">{STATUS_LABEL[status]}</div>
            </div>
          ))}
        </div>

        {/* Grid area (relative so SVG overlay sits on top of the row backgrounds) */}
        <div className="relative flex-1" style={{ height: GRID_H }}>
          {/* Row background stripes (alternating) */}
          {STATUS_ROWS.map((_, i) => (
            <div key={i} className="absolute left-0 right-0 border-b border-border last:border-b-0"
                 style={{ top: i * ROW_H, height: ROW_H, background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }} />
          ))}
          {/* Hour grid lines (24 cols × 4 sub-divisions) */}
          <div className="absolute inset-0 grid grid-cols-24">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="border-r border-border/60 last:border-r-0 relative">
                <div className="absolute left-1/4 top-0 bottom-0 w-px bg-border/30" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/30" />
                <div className="absolute left-3/4 top-0 bottom-0 w-px bg-border/30" />
              </div>
            ))}
          </div>
          {/* The continuous duty line — SVG overlay covering all 4 rows */}
          <svg
            className="absolute inset-0 pointer-events-none"
            preserveAspectRatio="none"
            viewBox={`0 0 100 ${GRID_H}`}
            style={{ width: '100%', height: GRID_H }}
          >
            {/* Light tint behind each segment matching its row */}
            {segments.map((s, i) => {
              const x1 = (s.start_min / 1440) * 100
              const x2 = (s.end_min / 1440) * 100
              const rowIdx = STATUS_ROW[s.status]
              return (
                <rect key={`bg-${i}`} x={x1} y={rowIdx * ROW_H} width={Math.max(0.05, x2 - x1)}
                      height={ROW_H} fill={statusColor(s.status)} opacity={0.08} />
              )
            })}
            {/* The continuous duty line itself */}
            {pathData && (
              <path d={pathData} stroke={DUTY_LINE_COLOR} strokeWidth={0.9}
                    fill="none" strokeLinejoin="miter" strokeLinecap="square" vectorEffect="non-scaling-stroke" />
            )}
            {/* Dots at each duty-change point (the corners of the line) */}
            {segments.map((s, i) => {
              const x = (s.start_min / 1440) * 100
              const y = STATUS_Y[s.status]
              return <circle key={`d-${i}`} cx={x} cy={y} r={0.7} fill={DUTY_LINE_COLOR} vectorEffect="non-scaling-stroke" />
            })}
            {/* Final dot at end of last segment */}
            {segments.length > 0 && (() => {
              const last = segments[segments.length - 1]
              return <circle cx={(last.end_min / 1440) * 100} cy={STATUS_Y[last.status]} r={0.7}
                             fill={DUTY_LINE_COLOR} vectorEffect="non-scaling-stroke" />
            })()}
          </svg>
        </div>

        {/* Right totals column */}
        <div className="w-[80px] flex-shrink-0 border-l border-border bg-canvas">
          {STATUS_ROWS.map((status) => (
            <div key={status} className="h-12 px-2 py-1.5 border-b border-border last:border-b-0 text-right">
              <div className="font-bold tnum text-ink text-xs">{status === 'D' ? totals.miles.toFixed(0) : '—'}</div>
              <div className="text-muted tnum text-xs">{hoursForStatus(status, totals)}h</div>
            </div>
          ))}
        </div>
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

// Build the continuous duty line path (the classic paper-log line that crosses rows).
// Returns an SVG path string. X scale = 0-100 (matching viewBox); Y is in pixels 0-GRID_H.
function buildContinuousDutyPath(segments: DaySegment[]): string {
  if (segments.length === 0) return ''
  // Sort by start_min (segments should already be sorted, but defensive)
  const sorted = [...segments].sort((a, b) => a.start_min - b.start_min)
  let d = ''
  sorted.forEach((s, i) => {
    const x1 = (s.start_min / 1440) * 100
    const x2 = (s.end_min / 1440) * 100
    const y = STATUS_Y[s.status]
    if (i === 0) {
      // Move to the start of the first segment
      d += `M ${x1.toFixed(4)} ${y} `
    } else {
      // Vertical connector from previous segment's end y to this segment's y at x1
      const prevY = STATUS_Y[sorted[i - 1].status]
      if (prevY !== y) {
        d += `L ${x1.toFixed(4)} ${prevY} L ${x1.toFixed(4)} ${y} `
      } else {
        d += `L ${x1.toFixed(4)} ${y} `
      }
    }
    // Horizontal line to the end of this segment
    d += `L ${x2.toFixed(4)} ${y} `
  })
  return d.trim()
}

const DUTY_LINE_COLOR = '#0B2545'

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
