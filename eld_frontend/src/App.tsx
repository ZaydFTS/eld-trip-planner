import { useEffect, useMemo, useState } from 'react'
import { Truck, Clock, Info, ChevronLeft } from 'lucide-react'
import type { TripPlan, SampleTrip } from './types'
import { fetchSamples, planTrip, planSample } from './api'
import TopAppBar from './components/TopAppBar'
import TripInputScreen from './screens/TripInputScreen'
import ResultsScreen from './screens/ResultsScreen'
import { ComplianceBanner } from './components/Banners'

type View = 'input' | 'results'

export default function App() {
  const [view, setView] = useState<View>('input')
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [samples, setSamples] = useState<SampleTrip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSamples().then(setSamples).catch(() => {})
  }, [])

  const handlePlan = async (input: {
    current_location: string
    pickup_location: string
    dropoff_location: string
    current_cycle_used_hours: number
  }) => {
    setLoading(true)
    setError(null)
    try {
      const result = await planTrip(input)
      setPlan(result)
      setView('results')
    } catch (e: any) {
      setError(e.message || 'Trip planning failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSample = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await planSample(id)
      setPlan(result)
      setView('results')
    } catch (e: any) {
      setError(e.message || 'Sample planning failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setView('input')
    setPlan(null)
    setError(null)
  }

  const cycleHours = useMemo(
    () => (plan ? plan.summary.cycle_used_h : 0),
    [plan],
  )

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopAppBar cycleHours={cycleHours} onLogoClick={handleBack} />

      {error && (
        <ComplianceBanner
          kind="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <main className="flex-1">
        {view === 'input' && (
          <TripInputScreen
            samples={samples}
            loading={loading}
            onPlan={handlePlan}
            onSample={handleSample}
          />
        )}
        {view === 'results' && plan && (
          <ResultsScreen plan={plan} onBack={handleBack} />
        )}
      </main>

      <footer className="border-t border-border bg-white px-6 py-3 flex items-center justify-between text-[11px] text-muted">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-success" />
          Telematics Engine v1.0 · US FMCSA 49 CFR Part 395 Verified
        </div>
        <div>© 2026 ELD Trip Planner · Property-carrying CMV · 70hr / 8-day cycle</div>
      </footer>
    </div>
  )
}
