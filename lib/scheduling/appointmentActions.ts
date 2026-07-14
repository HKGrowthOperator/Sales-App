// ============================================================
// Appointment Lifecycle — Reschedule / Cancel / No-Show.
// Zentrale, validierte Services. Nutzen denselben Doppelbuchungs-
// schutz wie bookAppointment, canceln/erzeugen Reminder, erzeugen
// Mail-Previews, schreiben Automation-Logs + KPI-Events.
// ============================================================
import { APPOINTMENT_STATUS, BLOCKING_APPOINTMENT_STATUSES, CALENDAR_SYNC, isTerminalAppointmentStatus } from '@/lib/scheduling/status'
import { isSlotBookable } from '@/lib/scheduling/slots'

type Supabase = any

interface ActionBase { supabase: Supabase; appointmentId: string; actorUserId: string }

export type ActionResult =
  | { ok: true; message: string; mailStatus?: string }
  | { ok: false; code: 'not_found' | 'terminal' | 'slot_taken' | 'error'; message: string }

const roleOfAppt = (apptType: string) => (apptType === 'Closer-Call' ? 'closer' : 'setter')

// ── Shared helpers ──────────────────────────────────────────────────────────
async function logAction(supabase: Supabase, p: { leadId: string; appointmentId: string; eventType: string; actionType: string; idempotencyKey: string; message: string; metadata?: any }) {
  await supabase.from('automation_logs').insert({
    lead_id: p.leadId, appointment_id: p.appointmentId,
    event_type: p.eventType, action_type: p.actionType, status: 'completed',
    message: p.message, idempotency_key: p.idempotencyKey, metadata_json: p.metadata ?? null,
  })
}
async function cancelRemindersFor(supabase: Supabase, appointmentId: string) {
  await supabase.from('reminder_jobs').update({ status: 'cancelled' })
    .eq('appointment_id', appointmentId).eq('status', 'pending')
}
async function createRemindersFor(supabase: Supabase, p: { leadId: string; appointmentId: string; startAt: string }) {
  const start = new Date(p.startAt).getTime()
  await supabase.from('reminder_jobs').insert([
    { lead_id: p.leadId, appointment_id: p.appointmentId, type: 'reminder_24h', channel: 'email', send_at: new Date(start - 24 * 3600e3).toISOString(), status: 'pending' },
    { lead_id: p.leadId, appointment_id: p.appointmentId, type: 'reminder_1h', channel: 'email', send_at: new Date(start - 1 * 3600e3).toISOString(), status: 'pending' },
  ])
}
async function createMail(supabase: Supabase, p: { leadId: string; appointmentId: string; type: string; toEmail: string | null; subject: string; body: string; event: string; actor: string }): Promise<string> {
  const status = p.toEmail ? 'draft' : 'blocked_missing_email'
  await supabase.from('email_jobs').insert({
    lead_id: p.leadId, appointment_id: p.appointmentId, type: p.type,
    to_email: p.toEmail, subject: p.subject, body: p.body, status,
    created_from_event: p.event, created_by: p.actor,
  })
  return status
}
const fmt = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso))

async function loadAppt(supabase: Supabase, appointmentId: string) {
  const { data } = await supabase.from('appointments')
    .select('*, lead:leads(id, company_name, contact_name, email, status)')
    .eq('id', appointmentId).single()
  return data
}

// ── 1. RESCHEDULE ───────────────────────────────────────────────────────────
export interface RescheduleArgs extends ActionBase {
  newStartAt: string
  newEndAt: string
  newAssignedUserId?: string
  reason?: string
}
export async function rescheduleAppointment(a: RescheduleArgs): Promise<ActionResult> {
  const appt = await loadAppt(a.supabase, a.appointmentId)
  if (!appt) return { ok: false, code: 'not_found', message: 'Termin nicht gefunden.' }
  if (isTerminalAppointmentStatus(appt.status)) return { ok: false, code: 'terminal', message: `Termin ist „${appt.status}" und kann nicht verschoben werden.` }

  const assignedUserId = a.newAssignedUserId || appt.assigned_user_id
  const durationMinutes = Math.max(15, Math.round((new Date(a.newEndAt).getTime() - new Date(a.newStartAt).getTime()) / 60000))
  const roleType = appt.appointment_type === 'Closer-Call' ? 'closer' : 'setter'

  // Neuer Slot muss serverseitig buchbar sein (Arbeitszeit, kein Urlaub, nicht Vergangenheit)
  const bookable = await isSlotBookable({ supabase: a.supabase, roleType, assignedUserId, startAt: a.newStartAt, durationMinutes })
  if (!bookable) return { ok: false, code: 'slot_taken', message: 'Der neue Termin ist außerhalb der Verfügbarkeit oder nicht mehr buchbar.' }

  // Konflikt am neuen Slot (außer diesem Termin)
  const { data: clash } = await a.supabase.from('appointments').select('id')
    .eq('assigned_user_id', assignedUserId).eq('appointment_at', a.newStartAt)
    .in('status', BLOCKING_APPOINTMENT_STATUSES).neq('id', a.appointmentId).maybeSingle()
  if (clash) return { ok: false, code: 'slot_taken', message: 'Der neue Termin ist bereits vergeben. Bitte anderen Slot wählen.' }

  // Update in place → alter Slot wird automatisch frei
  const { data: assignee } = await a.supabase.from('profiles').select('full_name, google_oauth_connected, default_call_link').eq('id', assignedUserId).single()
  const calendarSync = appt.calendar_sync_status === CALENDAR_SYNC.SYNCED
    ? CALENDAR_SYNC.PENDING                                   // war gesynct → muss re-synct werden
    : (assignee?.google_oauth_connected ? CALENDAR_SYNC.PENDING : CALENDAR_SYNC.INTERNAL_ONLY)

  const { error } = await a.supabase.from('appointments').update({
    appointment_at: a.newStartAt, end_at: a.newEndAt, assigned_user_id: assignedUserId,
    duration_minutes: durationMinutes, calendar_sync_status: calendarSync,
    closer: appt.appointment_type === 'Closer-Call' ? assignedUserId : appt.closer,
  }).eq('id', a.appointmentId)
  if (error) {
    if (error.code === '23505' || /duplicate|unique/i.test(error.message || '')) return { ok: false, code: 'slot_taken', message: 'Der neue Termin ist bereits vergeben. Bitte anderen Slot wählen.' }
    return { ok: false, code: 'error', message: error.message }
  }

  // Lead behält Status, Termin-Zeit aktualisieren
  await a.supabase.from('leads').update({ appointment_at: a.newStartAt, updated_at: new Date().toISOString() }).eq('id', appt.lead_id)

  await cancelRemindersFor(a.supabase, a.appointmentId)
  await createRemindersFor(a.supabase, { leadId: appt.lead_id, appointmentId: a.appointmentId, startAt: a.newStartAt })

  const mailStatus = await createMail(a.supabase, {
    leadId: appt.lead_id, appointmentId: a.appointmentId, type: 'appointment_rescheduled',
    toEmail: appt.lead?.email || appt.lead_email_snapshot || null,
    subject: 'Terminänderung – neuer Termin', event: 'APPOINTMENT_RESCHEDULED', actor: a.actorUserId,
    body: `Hallo ${appt.lead?.contact_name || ''},\n\nunser Termin wurde verschoben. Neuer Termin:\n\n${fmt(a.newStartAt)}${assignee?.full_name ? `\nAnsprechpartner: ${assignee.full_name}` : ''}${assignee?.default_call_link ? `\nLink: ${assignee.default_call_link}` : ''}\n\nBeste Grüße\nHK Growth`,
  })

  await logAction(a.supabase, { leadId: appt.lead_id, appointmentId: a.appointmentId, eventType: 'APPOINTMENT_RESCHEDULED', actionType: 'appointment_rescheduled', idempotencyKey: `RESCHED:${a.appointmentId}:${a.newStartAt}`, message: `Verschoben auf ${a.newStartAt}${a.reason ? ` (${a.reason})` : ''}` })
  await a.supabase.from('kpi_events').insert({ lead_id: appt.lead_id, actor_user_id: a.actorUserId, role_type: roleOfAppt(appt.appointment_type), event_type: 'appointment_rescheduled', metadata_json: { appointmentId: a.appointmentId, newStartAt: a.newStartAt } })

  return { ok: true, message: 'Termin verschoben.', mailStatus }
}

// ── 2. CANCEL ───────────────────────────────────────────────────────────────
export interface CancelArgs extends ActionBase {
  reason: string
  nextLeadStatus?: string
  sendMail?: boolean
}
export async function cancelAppointment(a: CancelArgs): Promise<ActionResult> {
  const appt = await loadAppt(a.supabase, a.appointmentId)
  if (!appt) return { ok: false, code: 'not_found', message: 'Termin nicht gefunden.' }
  if (isTerminalAppointmentStatus(appt.status)) return { ok: false, code: 'terminal', message: `Termin ist bereits „${appt.status}".` }

  const now = new Date().toISOString()
  await a.supabase.from('appointments').update({ status: APPOINTMENT_STATUS.CANCELLED, cancelled_at: now }).eq('id', a.appointmentId)
  await cancelRemindersFor(a.supabase, a.appointmentId)

  // Lead-Status NICHT blind auf Lost — Default Follow-up, sonst expliziter Wunsch
  const nextStatus = a.nextLeadStatus || 'Follow-up'
  await a.supabase.from('leads').update({ status: nextStatus, updated_at: now }).eq('id', appt.lead_id)

  let mailStatus: string | undefined
  if (a.sendMail) {
    mailStatus = await createMail(a.supabase, {
      leadId: appt.lead_id, appointmentId: a.appointmentId, type: 'appointment_cancelled',
      toEmail: appt.lead?.email || appt.lead_email_snapshot || null,
      subject: 'Termin abgesagt', event: 'APPOINTMENT_CANCELLED', actor: a.actorUserId,
      body: `Hallo ${appt.lead?.contact_name || ''},\n\nunser Termin am ${fmt(appt.appointment_at)} muss leider entfallen. Gern finden wir einen neuen Termin.\n\nBeste Grüße\nHK Growth`,
    })
  }

  await logAction(a.supabase, { leadId: appt.lead_id, appointmentId: a.appointmentId, eventType: 'APPOINTMENT_CANCELLED', actionType: 'appointment_cancelled', idempotencyKey: `CANCEL:${a.appointmentId}`, message: `Abgesagt: ${a.reason} → Lead-Status ${nextStatus}` })
  await a.supabase.from('kpi_events').insert({ lead_id: appt.lead_id, actor_user_id: a.actorUserId, role_type: roleOfAppt(appt.appointment_type), event_type: 'appointment_cancelled', metadata_json: { reason: a.reason, nextStatus } })

  return { ok: true, message: 'Termin abgesagt.', mailStatus }
}

// ── 3. NO-SHOW ──────────────────────────────────────────────────────────────
export interface NoShowArgs extends ActionBase {
  followUpAt?: string
  note?: string
}
export async function markNoShow(a: NoShowArgs): Promise<ActionResult> {
  const appt = await loadAppt(a.supabase, a.appointmentId)
  if (!appt) return { ok: false, code: 'not_found', message: 'Termin nicht gefunden.' }
  if (isTerminalAppointmentStatus(appt.status)) return { ok: false, code: 'terminal', message: `Termin ist bereits „${appt.status}".` }

  const now = new Date().toISOString()
  const role = roleOfAppt(appt.appointment_type)
  const followUpAt = a.followUpAt || new Date(Date.now() + 2 * 24 * 3600e3).toISOString()

  await a.supabase.from('appointments').update({ status: APPOINTMENT_STATUS.NO_SHOW, no_show_at: now }).eq('id', a.appointmentId)
  await cancelRemindersFor(a.supabase, a.appointmentId)

  // No-Show ist NICHT Lost → Follow-up
  await a.supabase.from('leads').update({ status: 'Follow-up', followup_at: followUpAt, updated_at: now }).eq('id', appt.lead_id)

  // Follow-up-Aufgabe (Opener-Attribution bleibt über source_role/booked_by erhalten)
  await a.supabase.from('followups').insert({
    lead_id: appt.lead_id, assigned_to: appt.assigned_user_id,
    role_type: role, due_at: followUpAt, type: 'Anruf',
    reason: 'No-Show', created_from_event: role === 'closer' ? 'CLOSER_CALL_NO_SHOW' : 'SETTER_CALL_NO_SHOW',
    appointment_id: a.appointmentId, note: a.note || 'Lead war beim Termin nicht erreichbar — reaktivieren.', status: 'offen',
  })

  // Reaktivierungs-Mail-Preview
  const mailStatus = await createMail(a.supabase, {
    leadId: appt.lead_id, appointmentId: a.appointmentId, type: 'reactivation',
    toEmail: appt.lead?.email || appt.lead_email_snapshot || null,
    subject: 'Wir haben Sie verpasst – neuer Termin?', event: 'NO_SHOW_RECORDED', actor: a.actorUserId,
    body: `Hallo ${appt.lead?.contact_name || ''},\n\nschade, dass es heute nicht geklappt hat. Wenn das Thema weiterhin relevant ist, finden wir gern einen neuen Termin.\n\nBeste Grüße\nHK Growth`,
  })

  const kpiEvent = role === 'closer' ? 'CLOSER_CALL_NO_SHOW' : 'SETTER_CALL_NO_SHOW'
  await logAction(a.supabase, { leadId: appt.lead_id, appointmentId: a.appointmentId, eventType: 'NO_SHOW_RECORDED', actionType: 'no_show_recorded', idempotencyKey: `NOSHOW:${a.appointmentId}`, message: `${kpiEvent} → Follow-up ${followUpAt}` })
  await a.supabase.from('kpi_events').insert({ lead_id: appt.lead_id, actor_user_id: a.actorUserId, role_type: role, event_type: kpiEvent, metadata_json: { appointmentId: a.appointmentId, followUpAt } })

  return { ok: true, message: 'Als No-Show markiert, Follow-up erstellt.', mailStatus }
}

// ── 4. COMPLETE (Termin als erledigt markieren) ─────────────────────────────
export async function markCompleted(a: ActionBase): Promise<ActionResult> {
  const appt = await loadAppt(a.supabase, a.appointmentId)
  if (!appt) return { ok: false, code: 'not_found', message: 'Termin nicht gefunden.' }
  if (isTerminalAppointmentStatus(appt.status)) return { ok: false, code: 'terminal', message: `Termin ist bereits „${appt.status}".` }
  const now = new Date().toISOString()
  await a.supabase.from('appointments').update({ status: APPOINTMENT_STATUS.COMPLETED, completed_at: now }).eq('id', a.appointmentId)
  await cancelRemindersFor(a.supabase, a.appointmentId)
  await logAction(a.supabase, { leadId: appt.lead_id, appointmentId: a.appointmentId, eventType: 'APPOINTMENT_COMPLETED', actionType: 'appointment_completed', idempotencyKey: `DONE:${a.appointmentId}`, message: 'Termin erledigt' })
  await a.supabase.from('kpi_events').insert({ lead_id: appt.lead_id, actor_user_id: a.actorUserId, role_type: roleOfAppt(appt.appointment_type), event_type: 'appointment_completed', metadata_json: { appointmentId: a.appointmentId } })
  return { ok: true, message: 'Termin als erledigt markiert.' }
}
