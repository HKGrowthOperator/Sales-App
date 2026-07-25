import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { renderHkEmailHtml } from '@/lib/email/layout'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/admin/mail-previews — eine einzelne vorbereitete Mail
// vor dem Versand anpassen (Betreff, Text, Empfänger).
//
// Ändert NUR diesen einen Mail-Job — die Vorlage in
// email_templates bleibt unberührt. Wer den Text dauerhaft für
// alle künftigen Mails ändern will, nutzt Admin → Mail-Vorlagen.
//
// Das HTML wird nach jeder Änderung neu im HK-Design gerendert,
// inklusive Termin-Box (Datum/Uhrzeit/Link aus dem Termin).
// Body: { action: 'save', id, subject, body, to_email? }
// ============================================================

const TZ = 'Europe/Berlin'
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))

// Status, in denen eine Mail noch bearbeitet werden darf.
// Verschickte oder gerade sendende Mails sind tabu.
const EDITABLE = ['draft', 'approved', 'blocked_missing_email', 'failed', 'cancelled']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const { data: me } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
  if (!me || me.role !== 'admin') return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { svc: createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } }) }
}

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin()
  if ('error' in ctx) return ctx.error
  const { svc } = ctx

  let payload: any
  try { payload = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }
  if (payload.action !== 'save') return NextResponse.json({ error: 'unbekannte Aktion' }, { status: 400 })

  const id = typeof payload.id === 'string' ? payload.id : null
  const subject = typeof payload.subject === 'string' ? payload.subject.trim() : ''
  const body = typeof payload.body === 'string' ? payload.body : ''
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  if (!subject) return NextResponse.json({ error: 'Betreff darf nicht leer sein' }, { status: 400 })
  if (!body.trim()) return NextResponse.json({ error: 'Text darf nicht leer sein' }, { status: 400 })

  const { data: job, error: loadErr } = await svc
    .from('email_jobs')
    .select('id, status, to_email, appointment_id')
    .eq('id', id)
    .maybeSingle()
  if (loadErr) return NextResponse.json({ ok: false, error: loadErr.message }, { status: 500 })
  if (!job) return NextResponse.json({ error: 'Mail nicht gefunden' }, { status: 404 })
  if (!EDITABLE.includes(job.status)) {
    return NextResponse.json({ error: `Mail mit Status „${job.status}" kann nicht mehr geändert werden` }, { status: 409 })
  }

  // Empfänger darf mitgeändert werden — sonst bleiben Mails ohne
  // Adresse für immer blockiert.
  const rawTo = typeof payload.to_email === 'string' ? payload.to_email.trim() : null
  const toEmail = rawTo === null ? job.to_email : (rawTo || null)
  if (toEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(toEmail)) {
    return NextResponse.json({ error: 'E-Mail-Adresse sieht nicht gültig aus' }, { status: 400 })
  }

  // Termin-Box aus dem verknüpften Termin rekonstruieren, damit
  // Datum, Uhrzeit und Call-Link nach dem Bearbeiten nicht verloren gehen.
  let vars: Record<string, string | null> = {}
  let callType: string | undefined
  if (job.appointment_id) {
    const { data: appt } = await svc
      .from('appointments')
      .select('id, type, appointment_at, assigned:profiles!appointments_assigned_user_id_fkey(full_name, default_call_link)')
      .eq('id', job.appointment_id)
      .maybeSingle()
    if (appt?.appointment_at) {
      const assigned: any = Array.isArray(appt.assigned) ? appt.assigned[0] : appt.assigned
      callType = appt.type === 'closer_call' ? 'closer_call' : 'setter_call'
      vars = {
        appointment_date: fmtDate(appt.appointment_at),
        appointment_time: fmtTime(appt.appointment_at),
        zoom_link: assigned?.default_call_link || null,
        expert_name: assigned?.full_name || null,
      }
    }
  }

  let bodyHtml: string | null = null
  try { bodyHtml = renderHkEmailHtml({ bodyText: body, subject, vars, callType }) } catch { bodyHtml = null }

  // Ohne Adresse bleibt/wird die Mail blockiert, mit Adresse wird sie
  // wieder ein normaler Entwurf. Freigegebene Mails fallen nach einer
  // Textänderung bewusst auf „draft" zurück — geändert heißt neu prüfen.
  const nextStatus = !toEmail
    ? 'blocked_missing_email'
    : job.status === 'blocked_missing_email' || job.status === 'approved' ? 'draft' : job.status

  const { data, error } = await svc
    .from('email_jobs')
    .update({ subject, body, body_html: bodyHtml, to_email: toEmail, status: nextStatus })
    .eq('id', id)
    .select('id, subject, body, body_html, to_email, status')
    .single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, job: data })
}
