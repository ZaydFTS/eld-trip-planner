/**
 * API client for the Django backend.
 * In dev, Vite proxies /api/* to http://127.0.0.1:8000.
 * In prod, set VITE_API_BASE to the deployed backend URL.
 */
import type { TripPlan, SampleTrip, DriverProfile } from './types'

const BASE = (import.meta as any).env?.VITE_API_BASE ?? ''

export async function fetchSamples(): Promise<SampleTrip[]> {
  const r = await fetch(`${BASE}/api/samples`)
  if (!r.ok) throw new Error(`Failed to fetch samples: ${r.status}`)
  const data = await r.json()
  return data.samples
}

export async function fetchDriver(): Promise<DriverProfile> {
  const r = await fetch(`${BASE}/api/driver`)
  if (!r.ok) throw new Error(`Failed to fetch driver profile: ${r.status}`)
  return r.json()
}

export async function planTrip(input: {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used_hours: number
}): Promise<TripPlan> {
  const r = await fetch(`${BASE}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }))
    throw new Error(err.error || `Plan failed: ${r.status}`)
  }
  return r.json()
}

export async function planSample(sampleId: string): Promise<TripPlan> {
  const r = await fetch(`${BASE}/api/plan/sample/${sampleId}`)
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }))
    throw new Error(err.error || `Plan sample failed: ${r.status}`)
  }
  return r.json()
}
