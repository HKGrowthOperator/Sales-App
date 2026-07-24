import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/leads/delete — Leads löschen (einzeln oder mehrere)
// ------------------------------------------------------------
// Berechtigung: admin darf alles; andere Rollen nur eigene Leads
// (assigned_to = user.id). Räumt abhängige Zeilen (call_notes,
// kpi_events, appointments, followups, mail/reminder-jobs,
// session_leads) auf und löst radar_targets-Verknüpfung.
// Body: { ids: string[] }
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'no_profile' }, { status: 403 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : []
  if (!ids.length) return NextResponse.json({ error: 'no_ids' }, { status: 400 })
  if (ids.length > 500) return NextResponse.json({ error: 'too_many', max: 500 }, { status: 413 })

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // Berechtigung: Nicht-Admins dürfen nur eigene Leads löschen.
  let allowed = ids
  if (profile.role !== 'admin') {
    const { data: own } = await svc.from('leads').select('id').in('id', ids).eq('assigned_to', user.id)
    allowed = (own || []).map((r: any) => r.id)
    if (!allowed.length) {
      return NextResponse.json({ error: 'forbidden', detail: 'Nur eigene Leads löschbar.' }, { status: 403 })
    }
  }

  // Abhängige Zeilen zuerst entfernen (falls keine ON DELETE CASCADE).
  const childTables = ['call_notes', 'kpi_events', 'appointments', 'followups', 'email_jobs', 'reminder_jobs', 'session_leads']
  for (const t of childTables) {
    await svc.from(t).delete().in('lead_id', allowed).then(() => {}, () => {})
  }
  // radar_targets-Verknüpfung lösen (promoted_lead_id → NULL, Status zurück).
  await svc.from('radar_targets')
    .update({ promoted_lead_id: null }).in('promoted_lead_id', allowed)
    .then(() => {}, () => {})

  const { error, count } = await svc.from('leads').delete({ count: 'exact' }).in('id', allowed)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, deleted: count ?? allowed.length })
}
