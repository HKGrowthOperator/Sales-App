// ============================================================
// Booking Service — zentrale, validierte Terminbuchung.
// Schützt gegen Doppelbuchung (DB-Unique-Index + Vorabprüfung) und
// löst die Sales-Event-Kaskade aus (Status, Mail-Preview, Reminder,
// KPI, Logs, Calendar-Sync-Status). Idempotent über automation_logs.
// ============================================================

import { APPOINTMENT_STATUS, BLOCKING_APPOINTMENT_STATUSES, CALENDAR_SYNC } from '@/lib/scheduling/status'
import { isSlotBookable } from '@/lib/scheduling/slots'
import { fetchGoogleBusyViaApi } from '@/lib/scheduling/busyClient'
import {
  productAreaFromEntryAngle, selectTemplate, renderEmailFull, buildTemplateVars,
  resolveMeetingLink, PRODUCT_LABEL, type CallType,
} from '@/lib/email/templates'
import { renderHkEmailHtml } from '@/lib/email/layout'

export type BookType = 'setter_call' | 'closer_call'

export interface BookArgs {
  supabase: any
  leadId: string
  type: BookType
  assignedUserId: string
  bookedByUserId: string
  sourceRole: 'opener' | 'setter' | 'admin'
  startAt: string            // ISO
  endAt: string              // ISO
  durationMinutes?: number
  contextNote?: string | null
  customerEmail?: string | null
  attendees?: string[] | null
}

export type BookResult =
  | { ok: true; appointmentId: string; calendarSync: string; mailStatus: string }
  | { ok: false; code: 'slot_taken' | 'slot_invalid' | 'lead_blocked' | 'lead_missing' | 'user_invalid' | 'error'; message: string }

const BLOCKED_LEAD_STATUS = ['Gewonnen', 'Verloren', 'Nicht passend', 'Nicht mehr kontaktieren']

const MAP = {
  setter_call: { apptType: 'Setter-Call', leadStatus: 'Setter-Call geplant', event: 'SETTER_CALL_BOOKED', kpi: 'setter_call_booked', mailType: 'setter_call_confirmation' },
  closer_call: { apptType: 'Closer-Call', leadStatus: 'Closer-Call geplant', event: 'CLOSER_CALL_BOOKED', kpi: 'closer_call_booked', mailType: 'closer_call_confirmation' },
} as const

export async function bookAppointment(args: BookArgs): Promise<BookResult> {
  const { supabase, leadId, type, assignedUserId, bookedByUserId, sourceRole, startAt } = args
  const map = MAP[type]
  const durationMinutes = args.durationMinutes ?? Math.max(15, Math.round((new Date(args.endAt).getTime() - new Date(startAt).getTime()) / 60000))

  // 1. Lead prüfen
  const { data: lead, error: leadErr } = await supabase.from('leads').select('*').eq('id', leadId).single()
  if (leadErr || !lead) return { ok: false, code: 'lead_missing', message: 'Lead nicht gefunden.' }
  if (lead.do_not_contact) return { ok: false, code: 'lead_blocked', message: 'Lead ist auf Opt-out und darf nicht weiter kontaktiert werden.' }
  if (BLOCKED_LEAD_STATUS.includes(lead.status)) return { ok: false, code: 'lead_blocked', message: `Lead-Status „${lead.status}" erlaubt keine Buchung.` }

  // 2. Zugewiesener User prüfen (existiert, aktiv, hat Regel für diese Rolle)
  const { data: assignee } = await supabase.from('profiles').select('id, full_name, is_active, default_call_link, google_calendar_id, google_oauth_connected').eq('id', assignedUserId).single()
  if (!assignee || assignee.is_active === false) return { ok: false, code: 'user_invalid', message: 'Zugewiesene Person ist nicht (mehr) verfügbar.' }

  // 2b. Slot serverseitig gegen Verfügbarkeit prüfen (Arbeitszeit, Urlaub, Vergangenheit)
  const roleType = type === 'closer_call' ? 'closer' : 'setter'
  // Diese Funktion wird auch aus dem Browser aufgerufen (CallNoteForm),
  // deshalb kommen die Google-Belegtzeiten über die API statt direkt.
  const externalBusy = await fetchGoogleBusyViaApi(roleType, new Date(startAt))
  const bookable = await isSlotBookable({ supabase, roleType, assignedUserId, startAt, durationMinutes, externalBusy })
  if (!bookable) return { ok: false, code: 'slot_invalid', message: 'Dieser Slot ist nicht (mehr) buchbar (außerhalb Verfügbarkeit oder vergeben).' }

  // 3. Slot-Konflikt vorab prüfen
  const { data: clash } = await supabase
    .from('appointments').select('id')
    .eq('assigned_user_id', assignedUserId)
    .eq('appointment_at', startAt)
    .in('status', BLOCKING_APPOINTMENT_STATUSES)
    .maybeSingle()
  if (clash) return { ok: false, code: 'slot_taken', message: 'Dieser Termin wurde gerade vergeben. Bitte anderen Slot auswählen.' }

  // 4. Appointment anlegen (Unique-Index ist die finale Race-Absicherung)
  const calendarSync = assignee.google_oauth_connected ? CALENDAR_SYNC.PENDING : CALENDAR_SYNC.INTERNAL_ONLY
  const insertRow: Record<string, any> = {
    lead_id: leadId,
    appointment_type: map.apptType,
    status: APPOINTMENT_STATUS.PLANNED,
    appointment_at: startAt,
    end_at: args.endAt,
    duration_minutes: durationMinutes,
    assigned_user_id: assignedUserId,
    booked_by_user_id: bookedByUserId,
    source_role: sourceRole,
    closer: type === 'closer_call' ? assignedUserId : null,
    customer_email: args.customerEmail || lead.email || null,
    attendees: args.attendees && args.attendees.length ? args.attendees : null,
    lead_email_snapshot: lead.email || null,
    lead_phone_snapshot: lead.phone || null,
    calendar_sync_status: calendarSync,
    google_meet_link: assignee.default_call_link || null,
    notes: args.contextNote || null,
  }
  const { data: appt, error: apptErr } = await supabase.from('appointments').insert(insertRow).select('id').single()
  if (apptErr) {
    if ((apptErr.code === '23505') || /duplicate key|unique/i.test(apptErr.message || '')) {
      return { ok: false, code: 'slot_taken', message: 'Dieser Termin wurde gerade vergeben. Bitte anderen Slot auswählen.' }
    }
    return { ok: false, code: 'error', message: apptErr.message }
  }
  const appointmentId = appt.id

  // 5. Sales-Event-Kaskade (best effort; Buchung gilt als erfolgreich, sobald appt existiert)
  const mailStatus = await runBookingCascade({ ...args, appointmentId, lead, assignee, durationMinutes, map, calendarSync })

  return { ok: true, appointmentId, calendarSync, mailStatus }
}

// ── Kaskade: Status, Log, KPI, Mail-Preview, Reminder, interne Übergabe ──
async function runBookingCascade(ctx: any): Promise<string> {
  const { supabase, leadId, assignedUserId, bookedByUserId, sourceRole, startAt, appointmentId, lead, assignee, durationMinutes, map, type } = ctx
  const now = new Date().toISOString()

  // Lead-Status + Zuweisung
  const leadUpdate: Record<string, any> = {
    status: map.leadStatus,
    appointment_at: startAt,
    last_contact_at: now,
    updated_at: now,
  }
  if (type === 'closer_call') leadUpdate.closer = assignedUserId
  await supabase.from('leads').update(leadUpdate).eq('id', leadId)

  // Automation-Log (idempotent)
  await logAction(supabase, {
    leadId, appointmentId, eventType: map.event, actionType: 'appointment_created',
    idempotencyKey: `${map.event}:${leadId}:${appointmentId}`,
    message: `${map.apptType} gebucht für ${new Date(startAt).toISOString()}`,
  })
  await logAction(supabase, {
    leadId, appointmentId, eventType: map.event, actionType: 'lead_status_updated',
    idempotencyKey: `STATUS:${appointmentId}`, message: map.leadStatus,
  })

  // KPI
  await supabase.from('kpi_events').insert({
    lead_id: leadId, actor_user_id: bookedByUserId, role_type: sourceRole,
    event_type: map.kpi, metadata_json: { appointmentId, assignedUserId, startAt },
  })

  // Mail-Preview
  const mailStatus = await createMailPreview(supabase, { lead, appointmentId, map, assignee, startAt, bookedByUserId, durationMinutes })
  await logAction(supabase, {
    leadId, appointmentId, eventType: map.event, actionType: 'mail_preview_created',
    idempotencyKey: `MAIL:${appointmentId}`, message: mailStatus,
  })

  // Reminder-Jobs
  await createReminderJobs(supabase, { leadId, appointmentId, startAt })
  await logAction(supabase, {
    leadId, appointmentId, eventType: map.event, actionType: 'reminder_created',
    idempotencyKey: `REMINDERS:${appointmentId}`, message: 'reminder_24h + reminder_1h',
  })

  // Calendar-Sync-Status
  await logAction(supabase, {
    leadId, appointmentId, eventType: map.event,
    actionType: ctx.calendarSync === 'pending' ? 'calendar_event_created' : 'sync_skipped',
    idempotencyKey: `CAL:${appointmentId}`,
    message: ctx.calendarSync === 'pending' ? 'Google-Sync ausstehend' : 'Google Calendar nicht verbunden (internal_only)',
  })

  return mailStatus
}

async function logAction(supabase: any, p: { leadId: string; appointmentId?: string; eventType: string; actionType: string; idempotencyKey: string; message: string }) {
  await supabase.from('automation_logs').insert({
    lead_id: p.leadId, appointment_id: p.appointmentId || null,
    event_type: p.eventType, action_type: p.actionType, status: 'completed',
    message: p.message, idempotency_key: p.idempotencyKey,
  })
  // Fehler (z.B. Idempotenz-Konflikt) bewusst ignorieren
}

async function createMailPreview(supabase: any, p: any): Promise<string> {
  const { lead, appointmentId, map, assignee, startAt, bookedByUserId } = p
  const toEmail = lead.email || null
  const isSetter = map.mailType === 'setter_call_confirmation'
  const callType: CallType = isSetter ? 'setter_call' : 'closer_call'
  const roleType: 'setter' | 'closer' = isSetter ? 'setter' : 'closer'
  // Schlüssel identisch zu den im Admin pflegbaren Vorlagen (Mail-Vorlagen-Editor).
  const templateKey = isSetter ? 'HK-SALES-EXPERT-CALL-BOOKED' : 'HK-SALES-CLOSER-BOOKED'
  const productArea = productAreaFromEntryAngle(lead.entry_angle)
  const expert = assignee.full_name || 'HK Growth'

  // Zoom/Meet: fester Team-/Rollen-Link aus meeting_links, sonst persönlicher default_call_link
  const zoomLink = await resolveMeetingLink(supabase, { roleType, productArea, fallback: assignee.default_call_link })

  const vars = buildTemplateVars({
    lead, startAt, timeZone: 'Europe/Berlin', productArea,
    expertName: expert,
    setterName: isSetter ? expert : null,
    closerName: !isSetter ? expert : null,
    zoomLink,
    // payment_link bewusst NICHT (kein Zahlungslink in Bestätigung); recommended_offer optional
  })

  // Vorlage aus DB wählen + rendern (Subject + Text-Fallback + HK-HTML).
  let subject: string, body: string, bodyHtml: string, templateId: string | null = null
  const tpl = await selectTemplate(supabase, { templateKey, callType, productArea })
  if (tpl) {
    templateId = tpl.id
    const r = renderEmailFull(tpl, vars, callType)
    subject = r.subject; body = r.text; bodyHtml = r.html
  } else {
    subject = isSetter ? 'Terminbestätigung – kostenloser Experten-Termin' : 'Terminbestätigung – Ihr Planungs-Termin mit HK Growth'
    body = `Hallo ${vars.first_name},\n\nhiermit bestätige ich unseren Termin. Die Details finden Sie oben.\n\nBeste Grüße\n${expert} – HK Growth`
    bodyHtml = renderHkEmailHtml({ bodyText: body, subject, vars, callType })
  }

  const status = toEmail ? 'draft' : 'blocked_missing_email'
  const { data: job, error } = await supabase.from('email_jobs').insert({
    lead_id: lead.id, appointment_id: appointmentId, type: map.mailType,
    to_email: toEmail, subject, body, body_html: bodyHtml, status,
    created_from_event: map.event, created_by: bookedByUserId,
  }).select('id').maybeSingle()
  // 23505 = Bestätigung existiert bereits (Idempotenz) → kein Duplikat, kein Fehler
  if (error && error.code !== '23505') return 'failed'

  // Audit: Termin ↔ Vorlage ↔ Mail-Job verknüpfen (idempotent über unique appointment+call_type)
  try {
    await supabase.from('appointment_email_events').insert({
      appointment_id: appointmentId, lead_id: lead.id, call_type: callType,
      product_area: productArea, template_key: templateKey, template_id: templateId,
      email_job_id: job?.id || null, status,
    })
  } catch { /* idempotenter Konflikt ok */ }

  // Interne Team-Benachrichtigung (Slack), send-ready — Versand über Runner + Flag
  try {
    await supabase.from('internal_notifications').insert({
      channel: 'slack', event_type: map.event, lead_id: lead.id, appointment_id: appointmentId,
      title: `${isSetter ? '📞 Setter-Call' : '🤝 Closer-Call'} gebucht – ${lead.company_name}`,
      body: `${lead.company_name}${lead.contact_name ? ` · ${lead.contact_name}` : ''}\n🗓 ${vars.appointment_date} ${vars.appointment_time}\n👤 ${expert}\n🎯 ${PRODUCT_LABEL[productArea]}\n✉️ Mail: ${status}`,
      status: 'pending', idempotency_key: `NOTIFY:${appointmentId}`,
      payload_json: { appointmentId, callType, productArea, expert, mailStatus: status },
    })
  } catch { /* idempotenter Konflikt ok */ }

  return status
}

async function createReminderJobs(supabase: any, p: { leadId: string; appointmentId: string; startAt: string }) {
  const start = new Date(p.startAt).getTime()
  const jobs = [
    { type: 'reminder_24h', send_at: new Date(start - 24 * 3600e3).toISOString() },
    { type: 'reminder_1h', send_at: new Date(start - 1 * 3600e3).toISOString() },
  ]
  await supabase.from('reminder_jobs').insert(jobs.map(j => ({
    lead_id: p.leadId, appointment_id: p.appointmentId,
    type: j.type, channel: 'email', send_at: j.send_at, status: 'pending',
  })))

  // Zwischen-Reminder („Mitte"): mittig zwischen Buchung und Termin — aber nur,
  // wenn mehr als 48h dazwischen liegen (sonst kollidiert er mit dem 24h-Reminder).
  // Separat eingefügt, damit ein evtl. noch nicht erlaubter Typ die Pflicht-
  // Reminder nicht mitreißt.
  const now = Date.now()
  const leadTime = start - now
  if (leadTime > 48 * 3600e3) {
    try {
      await supabase.from('reminder_jobs').insert({
        lead_id: p.leadId, appointment_id: p.appointmentId,
        type: 'reminder_mid', channel: 'email',
        send_at: new Date(now + leadTime / 2).toISOString(), status: 'pending',
      })
    } catch { /* Typ evtl. nicht erlaubt — Pflicht-Reminder bleiben unberührt */ }
  }
}
