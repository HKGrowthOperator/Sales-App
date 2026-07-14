import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST /api/radar/geocode
// Füllt fehlende Koordinaten von radar_targets per Nominatim (OSM, kein Key).
// Admin-gated. Verarbeitet pro Aufruf bis zu BATCH Targets (Nominatim-Policy:
// max ~1 Anfrage/Sekunde, daher sequentiell mit Pause). Mehrfach aufrufen,
// bis "remaining" 0 ist. n8n liefert lat/lng idealerweise direkt mit — das
// hier ist der Fallback für Bestands-Targets / Targets ohne Koordinaten.
const BATCH = 20
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

function buildQuery(t: any): string | null {
  const parts = [t.address, t.city, t.region].filter(Boolean)
  if (parts.length === 0 && t.company_name) parts.push(t.company_name, t.city || t.region)
  const q = parts.filter(Boolean).join(', ').trim()
  return q || null
}

async function geocode(q: string): Promise<{ lat: number; lon: number } | null> {
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&countrycodes=de`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'HK-Sales-Cockpit-LeadRadar/1.0 (intern)' },
  })
  if (!res.ok) return null
  const arr = await res.json()
  if (!Array.isArray(arr) || arr.length === 0) return null
  const lat = parseFloat(arr[0].lat)
  const lon = parseFloat(arr[0].lon)
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null
  return { lat, lon }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function POST() {
  const sb = await createServerClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  // Targets ohne Koordinaten holen
  const { data: targets, error } = await sb
    .from('radar_targets')
    .select('id, company_name, address, city, region, latitude, longitude')
    .is('latitude', null)
    .neq('status', 'dismissed')
    .limit(BATCH)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!targets || targets.length === 0) {
    return NextResponse.json({ geocoded: 0, failed: 0, remaining: 0, done: true })
  }

  let geocoded = 0
  let failed = 0
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i]
    const q = buildQuery(t)
    if (!q) { failed++; continue }
    try {
      const hit = await geocode(q)
      if (hit) {
        await sb.from('radar_targets')
          .update({ latitude: hit.lat, longitude: hit.lon })
          .eq('id', t.id)
        geocoded++
      } else {
        failed++
      }
    } catch {
      failed++
    }
    if (i < targets.length - 1) await sleep(1100) // Nominatim: ~1 req/s
  }

  // Wie viele bleiben noch?
  const { count } = await sb
    .from('radar_targets')
    .select('id', { count: 'exact', head: true })
    .is('latitude', null)
    .neq('status', 'dismissed')

  return NextResponse.json({ geocoded, failed, remaining: count ?? 0, done: (count ?? 0) === 0 })
}
