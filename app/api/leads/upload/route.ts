import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { IngestLead } from '@/lib/radar/ingestContract'
import { runLeadImportPipeline } from '@/lib/leads/importPipeline'
import { rateLimit } from '@/lib/security/rateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ============================================================
// POST /api/leads/upload — In-App-Lead-Upload (CSV/Tabelle/Sheet)
// ------------------------------------------------------------
// Nimmt vom Upload-UI (/leads/upload) bereits gemappte Lead-Objekte
// entgegen (IngestLead-Form) und schickt sie durch DIESELBE Pipeline
// wie der Radar-Ingest: Dedup, No-Fit-Filter, Research/Enrichment
// (Website/Social vorhanden? Entscheider? Pain?), Read-Back gegen das
// CRM und Auto-Promote in den Opener-Pool — Verkaufs-Vorbereitung inklusive.
//
// Auth: eingeloggter Sales-App-User (Supabase-Session), KEIN Radar-Secret.
// Body: { leads: IngestLead[], lead_source?: string, assigned_to?: string }
// Das UI chunked große Listen (Research braucht Zeit, maxDuration 60s).
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles').select('id, role').eq('id', user.id).single()
  if (!profile) {
    return NextResponse.json({ error: 'no_profile' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // Jeder Aufruf kann Research und Enrichment ausloesen — beides
  // kostenpflichtig. 20 Aufrufe je 200 Leads pro Stunde reichen fuer den
  // Import mehrerer Listen und decken eine Schleife trotzdem ab.
  const rl = rateLimit(`upload:${user.id}`, 20, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', detail: `Zu viele Importe. Bitte in ${rl.retryAfterSeconds} Sekunden erneut versuchen.` },
      { status: 429, headers: { 'retry-after': String(rl.retryAfterSeconds) } },
    )
  }

  const leads: IngestLead[] = Array.isArray(body?.leads) ? body.leads : []
  if (!leads.length) {
    return NextResponse.json({ error: 'no_leads' }, { status: 400 })
  }
  if (leads.length > 200) {
    return NextResponse.json({ error: 'batch_too_large', max: 200 }, { status: 413 })
  }

  const leadSource = (typeof body.lead_source === 'string' && body.lead_source.trim())
    ? body.lead_source.trim().slice(0, 80)
    : 'Tabellen-Import'
  const assignedTo = typeof body.assigned_to === 'string' && body.assigned_to ? body.assigned_to : null

  const { results, summary, missingColumns } = await runLeadImportPipeline(leads, {
    leadSource,
    scanSource: 'upload',
    assignedTo,
  })

  return NextResponse.json({ ok: true, received: leads.length, summary, results, missingColumns })
}
