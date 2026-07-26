import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { selectTemplate } from '@/lib/email/templates'
import { productAreaFromEntryAngle } from '@/lib/email/templates'
import { buildSalutation } from '@/lib/email/salutation'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/leads/info-mail — "Kunde will keinen Termin, sondern Infos"
// ------------------------------------------------------------
// Opener-Pfad: statt Setter-Termin geht eine vollständige Info-Mail raus
// (Fakten, Testimonials, Angebote ohne Preis, Value → nächster Schritt
// wird zum No-Brainer). Nutzt die Vorlage HK-SALES-INFO-MAIL aus
// email_templates (im Admin pflegbar), sonst einen neutralen Fallback.
//
// Erzeugt einen email_jobs-Eintrag (Draft bzw. approved, je nach Wunsch) —
// Versand übernimmt der Job-Runner. Kein Blindversand ohne Freigabe-Flag.
// Body: { lead_id: string, send?: boolean }
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  const leadId = typeof body?.lead_id === 'string' ? body.lead_id : null
  if (!leadId) return NextResponse.json({ error: 'lead_id fehlt' }, { status: 400 })

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: lead } = await svc
    .from('leads')
    .select('id, company_name, contact_name, email, entry_angle, do_not_contact')
    .eq('id', leadId).single()
  if (!lead) return NextResponse.json({ error: 'lead_not_found' }, { status: 404 })
  if (lead.do_not_contact) {
    return NextResponse.json({ error: 'opt_out', detail: 'Lead ist gesperrt (nicht kontaktieren).' }, { status: 409 })
  }

  const { data: me } = await svc.from('profiles').select('full_name').eq('id', user.id).single()
  const firstName = (lead.contact_name || '').split(' ')[0]
  const productArea = productAreaFromEntryAngle(lead.entry_angle)

  // Vorlage aus dem Admin-Bereich bevorzugen
  const tpl = await selectTemplate(svc, {
    templateKey: 'HK-SALES-INFO-MAIL',
    callType: 'setter_call',
    productArea,
  })

  const vars: Record<string, string> = {
    contact_first_name: firstName || '',
    contact_salutation: buildSalutation(lead as any) || firstName || '',
    company_name: lead.company_name || '',
    assigned_opener_name: me?.full_name || 'HK Growth',
    assigned_setter_name: me?.full_name || 'HK Growth',
    assigned_closer_name: me?.full_name || 'HK Growth',
  }
  const fill = (s: string) => s.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => vars[k] ?? '')

  const subject = tpl?.subject
    ? fill(tpl.subject)
    : `HK Growth – Infos für ${lead.company_name}`
  const bodyText = tpl?.body_text
    ? fill(tpl.body_text)
    : `Hallo ${firstName || ''},\n\nwie besprochen schicke ich Ihnen die Infos zu HK Growth.\n\n(Dieser Standardtext ist ein Platzhalter — hinterlege den echten Text unter Admin → Mail-Vorlagen: „Info-Mail (kein Termin gewünscht)".)\n\nBeste Grüße\n${me?.full_name || 'HK Growth'}`

  const to = lead.email || null
  const { data: job, error } = await svc.from('email_jobs').insert({
    lead_id: lead.id,
    type: 'info_mail',
    to_email: to,
    subject,
    body: bodyText,
    status: to ? (body.send === true ? 'approved' : 'draft') : 'blocked_missing_email',
    created_from_event: 'INFO_MAIL_REQUESTED',
    created_by: user.id,
  }).select('id, status, subject, body, to_email').single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  // Aktivität protokollieren (best-effort)
  try {
    await svc.from('kpi_events').insert({
      lead_id: lead.id, actor_user_id: user.id, role_type: 'opener',
      event_type: 'info_mail_requested', metadata_json: { template: tpl?.key || 'fallback' },
    })
    await svc.from('leads').update({
      last_contact_at: new Date().toISOString(),
      next_step: 'Info-Mail versendet — in 3–5 Tagen nachfassen',
      updated_at: new Date().toISOString(),
    }).eq('id', lead.id)
  } catch {}

  return NextResponse.json({
    ok: true,
    status: job?.status,
    usedTemplate: !!tpl?.id,
    missingEmail: !to,
    // Der Dialer bietet direkt danach das Anpassen an — damit ein Zusatz,
    // um den der Kunde im Call gebeten hat, in dieselbe Mail wandert.
    job: job
      ? { id: job.id, subject: job.subject, body: job.body, to_email: job.to_email }
      : null,
  })
}
