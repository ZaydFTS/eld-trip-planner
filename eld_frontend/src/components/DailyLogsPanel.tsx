import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react'
import type { TripPlan, DailyLog, DaySegment } from '../types'
import LogSheet from './LogSheet'

interface Props {
  plan: TripPlan
}

export default function DailyLogsPanel({ plan }: Props) {
  const { daily_logs, summary } = plan
  const [activeDay, setActiveDay] = useState(0)

  const log = daily_logs[activeDay]
  if (!log) {
    return <div className="p-10 text-center text-muted">No logs available.</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      {/* Top bar: compliance + day selector */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveDay((d) => Math.max(0, d - 1))}
            disabled={activeDay === 0}
            className="w-8 h-8 rounded-btn border border-border-strong flex items-center justify-center disabled:opacity-30 hover:bg-canvas"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="chip bg-steel-tint text-steel font-semibold">
            Day {activeDay + 1} · {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <button
            onClick={() => setActiveDay((d) => Math.min(daily_logs.length - 1, d + 1))}
            disabled={activeDay === daily_logs.length - 1}
            className="w-8 h-8 rounded-btn border border-border-strong flex items-center justify-center disabled:opacity-30 hover:bg-canvas"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className={`chip ${summary.compliant ? 'bg-steel-tint text-steel' : 'bg-amber/10 text-amber-dark'}`}>
            <FileText className="w-3.5 h-3.5" />
            49 CFR §395.8 {summary.compliant ? 'COMPLIANT' : 'REVIEW'}
          </div>
          <button className="btn-amber !h-9 !px-4 !text-xs">
            <Download className="w-3.5 h-3.5" /> Download All Logs (PDF)
          </button>
        </div>
      </div>

      {/* Day tabs (film strip) */}
      <div className="flex gap-2 mb-5 overflow-x-auto scroll-thin">
        {daily_logs.map((l, i) => {
          const totals = l.totals
          return (
            <button
              key={l.date}
              onClick={() => setActiveDay(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-btn border text-left transition ${
                i === activeDay
                  ? 'bg-navy border-navy text-white'
                  : 'bg-white border-border text-ink hover:border-steel'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wide opacity-70">Day {i + 1}</div>
              <div className="text-xs font-semibold tnum">
                {new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-[10px] opacity-70 tnum">{totals.driving_h}h drive · {totals.miles} mi</div>
            </button>
          )
        })}
      </div>

      {/* The log sheet itself */}
      <LogSheet log={log} driver={plan.driver} />
    </div>
  )
}
