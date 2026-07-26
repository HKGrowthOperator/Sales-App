import { NextRequest, NextResponse } from 'next/server'
import { secretEquals, rateLimit } from '@/lib/security/rateLimit'
import { IngestLead } from '@/lib/radar/ingestContract'
import { runLeadImportPipeline } from '@/lib/leads/importPipeline'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ============================================================
// POST /api/leads/ingest   (ENTWURF — final nach Luis' Radar-Antwort)
// ------------------------------------------------------------
// Aufnahme-Endpoint für sales-ready Leads aus dem Lead-Radar. Erwartet die
// im RADAR_INGEST_API.md beschriebene JSON-Struktur — einzeln, als Array,
// oder { "leads": [...] }.
//
// Verarbeitung: gemeinsame Pipeline in lib/leads/importPipeline.ts
// (Mapping/Validierung → No-Fit-Filter → Research/Enrichment → Read-Back
//  → radar_targets upsert → Auto-Promote in den Opener-Pool).
// Auth: Header x-radar-secret == RADAR_INGEST_SECRET (Fallback N8N_RADAR_WEBHOOK_SECRET).
// ============================================================

const SECRET = process.env.RADAR_INGEST_SECRET || process.env.N8N_RADAR_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  if (!SECRET) {
    return NextResponse.json(
      { error: 'ingest_disabled', detail: 'RADAR_INGEST_SECRET nicht gesetzt.' },
      { status: 503 },
    )
  }
  const header = req.headers.get('x-radar-secret')
    || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  // Der Radar-Endpunkt haengt an einem geteilten Geheimnis. Selbst wenn das
  // durchsickert, bleibt der Schaden begrenzt: 60 Aufrufe pro Stunde reichen
  // dem Radar und decken einen Dauerbeschuss ab.
  const rlIngest = rateLimit('ingest:global', 60, 60 * 60 * 1000)
  if (!rlIngest.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', detail: `Zu viele Anfragen. In ${rlIngest.retryAfterSeconds} Sekunden erneut versuchen.` },
      { status: 429, headers: { 'retry-after': String(rlIngest.retryAfterSeconds) } },
    )
  }

  if (!secretEquals(header, SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const leads: IngestLead[] = Array.isArray(body)
    ? body
    : Array.isArray((body as any)?.leads)
      ? (body as any).leads
      : body && typeof body === 'object'
        ? [body as IngestLead]
        : []

  if (!leads.length) {
    return NextResponse.json({ error: 'no_leads' }, { status: 400 })
  }
  if (leads.length > 200) {
    return NextResponse.json({ error: 'batch_too_large', max: 200 }, { status: 413 })
  }

  const { results, summary, missingColumns } = await runLeadImportPipeline(leads, {
    leadSource: 'Lead Radar',
    scanSource: 'ingest',
    emitContract: true,
  })

  return NextResponse.json({ ok: true, received: leads.length, summary, results, missingColumns })
}
