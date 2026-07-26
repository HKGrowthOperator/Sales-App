import { NextRequest, NextResponse } from 'next/server'
import { secretEquals } from '@/lib/security/rateLimit'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ============================================================
// GET /api/leads/state?keys=a.de,b.de   (oder ?dedup_key=a.de)
//   POST /api/leads/state  { "keys": ["a.de", "+49..."] }   (für große Listen)
// ------------------------------------------------------------
// Read-Back für das Radar: pro dedup_key der CRM-Status aus v_radar_lead_state.
// Damit das Radar NICHT doppelt liefert und Opt-out-/Bestandsfirmen erkennt.
// Erwartet bereits normalisierte dedup_keys (Regel: siehe RADAR_INGEST_API.md).
// Auth: Header x-radar-secret == RADAR_INGEST_SECRET (Fallback N8N_RADAR_WEBHOOK_SECRET).
// ============================================================

const SECRET = process.env.RADAR_INGEST_SECRET || process.env.N8N_RADAR_WEBHOOK_SECRET || ''

function authed(req: NextRequest): boolean {
  if (!SECRET) return false
  const h = req.headers.get('x-radar-secret')
    || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  return secretEquals(h, SECRET)
}

async function lookup(keys: string[]) {
  const clean = Array.from(new Set(keys.map((k) => k.trim()).filter(Boolean)))
  if (!clean.length) return { states: [], unknown: [] as string[] }

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  const { data, error } = await svc
    .from('v_radar_lead_state')
    .select('dedup_key,lead_id,status,lead_score,do_not_contact,last_contact_at,appointment_at,is_customer,is_active_deal')
    .in('dedup_key', clean)
  if (error) throw new Error(error.message)

  const found = new Set((data || []).map((r: any) => r.dedup_key))
  const unknown = clean.filter((k) => !found.has(k))
  return { states: (data || []).map((r: any) => ({ ...r, known: true })), unknown }
}

export async function GET(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ error: SECRET ? 'unauthorized' : 'ingest_disabled' }, { status: SECRET ? 401 : 503 })
  }
  const url = new URL(req.url)
  const keys = [
    ...(url.searchParams.get('keys')?.split(',') || []),
    ...(url.searchParams.get('dedup_key') ? [url.searchParams.get('dedup_key') as string] : []),
  ]
  try {
    return NextResponse.json({ ok: true, ...(await lookup(keys)) })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ error: SECRET ? 'unauthorized' : 'ingest_disabled' }, { status: SECRET ? 401 : 503 })
  }
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const keys: string[] = Array.isArray(body?.keys) ? body.keys.map(String) : []
  try {
    return NextResponse.json({ ok: true, ...(await lookup(keys)) })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
