// ============================================================
// Job-Runner — führt die vorbereiteten Automationen tatsächlich aus.
// Verarbeitet fällige Reminder, sendbare Mail-Jobs und offene
// Calendar-Syncs. Sicher gegated über app_settings-Flags + Provider-
// Konfiguration: ohne Keys/Flags wird nichts gesendet (skipped).
// Idempotent + resilient (try/catch pro Item). Service-Role-Client.
// ============================================================
import { getFlags, googleConfigured } from '@/lib/settings'
import { sendEmail, emailConfigured } from '@/lib/email/send'
import { sendSlack, slackConfigured } from '@/lib/integrations/slack'
import { BLOCKING_APPOINTMENT_STATUSES, isBlockingAppointmentStatus, isCloserAppointment } from '@/lib/scheduling/status'
import { buildCalendarInputFromAppointment, createCalendarEvent } from '@/lib/integrations/google-calendar'
import { selectTemplate } from '@/lib/email/templates'
import { renderHkEmailHtml } from '@/lib/email/layout'

const fmt = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso))
const fmtDate = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'full' }).format(new Date(iso))
const fmtTime = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', timeStyle: 'short' }).format(new Date(iso))

// Reminder-Typ + Termin-Art → Vorlagen-Schlüssel (im Admin pflegbar).
/**
 * Setzt einen Mail-Job auf "failed" UND hinterlegt den Grund.
 *
 * Vorher wurde nur der Status geschrieben und die Fehlermeldung von Resend
 * verworfen. Damit stand im Postfach "failed" ohne jede Erklaerung — nicht
 * nachvollziehbar, ob die Adresse falsch, die Domain unverifiziert oder der
 * Schluessel ungueltig war.
 *
 * Kennt die Tabelle die Spalte last_error nicht, wird still auf das reine
 * Status-Update zurueckgefallen; ein fehlendes Protokollfeld darf den
 * Versandlauf nicht stoppen.
 */
async function markEmailFailed(supabase: any, id: string, reason: string | undefined) {
  const msg = (reason || 'Unbekannter Fehler').slice(0, 500)
  const { error } = await supabase.from('email_jobs').update({ status: 'failed', last_error: msg }).eq('id', id)
  if (error) {
    await supabase.from('email_jobs').update({ status: 'failed' }).eq('id', id)
  }
}

/**
 * Vorlagen-Schluessel fuer einen Reminder, in absteigender Genauigkeit.
 *
 * Fuer Closer-Termine gibt es keine eigene MID-Vorlage — der
 * Zwischen-Reminder entsteht nur bei mehr als 48h Vorlauf und war
 * deshalb nie gepflegt. Ohne Rueckfallebene bekaeme der Kunde in dem
 * Fall den nackten Standardtext statt der gestalteten Mail. Deshalb
 * wird der Reihe nach gesucht und die erste vorhandene Vorlage genommen.
 */
function reminderTemplateKeys(reminderType: string, apptType: string | null | undefined): string[] {
  const closer = isCloserAppointment(apptType)
  const suffix = reminderType === 'reminder_1h' ? '1H' : reminderType === 'reminder_mid' ? 'MID' : '24H'
  const keys = closer
    ? [`HK-SALES-CLOSER-${suffix}`, `HK-SALES-EXPERT-CALL-${suffix}`]
    : [`HK-SALES-EXPERT-CALL-${suffix}`]
  // Gibt es die MID-Vorlage nirgends, ist die 24h-Fassung immer noch
  // deutlich besser als gar keine Vorlage.
  if (suffix === 'MID') keys.push(closer ? 'HK-SALES-CLOSER-24H' : 'HK-SALES-EXPERT-CALL-24H')
  return keys
}

function fillVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => vars[k] ?? '')
}

export interface JobRunSummary {
  at: string
  flags: Record<string, boolean>
  emailConfigured: boolean
  googleConfigured: boolean
  reminders: { processed: number; sent: number; failed: number; skipped: number; cancelled: number }
  emails: { processed: number; sent: number; failed: number; skipped: number }
  calendar: { processed: number; synced: number; failed: number; skipped: number }
  notifications: { processed: number; sent: number; failed: number; skipped: number }
  /** Fehler, die frueher still verschluckt wurden — z. B. eine fehlgeschlagene
   *  Abfrage. Ohne sie sah ein kaputter Durchlauf wie ein leerer aus. */
  errors: string[]
}

export async function runDueJobs(supabase: any, now: Date = new Date()): Promise<JobRunSummary> {
  const flags = await getFlags(supabase)
  const nowIso = now.toISOString()
  const mailReady = emailConfigured()
  const gReady = googleConfigured()
  const sum: JobRunSummary = {
    at: nowIso, flags: flags as any, emailConfigured: mailReady, googleConfigured: gReady,
    reminders: { processed: 0, sent: 0, failed: 0, skipped: 0, cancelled: 0 },
    emails: { processed: 0, sent: 0, failed: 0, skipped: 0 },
    calendar: { processed: 0, synced: 0, failed: 0, skipped: 0 },
    notifications: { processed: 0, sent: 0, failed: 0, skipped: 0 },
    errors: [],
  }

  // ── 1) Fällige Reminder ────────────────────────────────────────────────────
  // Backlog-Schutz: überfällige Reminder (älter als 6h) NICHT mehr senden, sondern stornieren.
  const cutoffIso = new Date(now.getTime() - 6 * 3600e3).toISOString()
  await supabase.from('reminder_jobs').update({ status: 'cancelled', last_error: 'stale (Backlog übersprungen)' })
    .eq('status', 'pending').lt('send_at', cutoffIso)

  // Die Spalte heisst appointment_type, nicht type. Mit dem falschen Namen
  // scheiterte die gesamte Abfrage — und weil der Fehler verworfen wurde,
  // lief der Durchlauf still mit null Remindern durch.
  const { data: reminders, error: remErr } = await supabase
    .from('reminder_jobs')
    .select('*, appointment:appointments(id, appointment_type, status, appointment_at, lead_email_snapshot, lead:leads(contact_name,email,company_name), assigned:profiles!appointments_assigned_user_id_fkey(full_name, default_call_link))')
    .eq('status', 'pending').lte('send_at', nowIso).gte('send_at', cutoffIso).limit(100)
  if (remErr) sum.errors.push(`Reminder-Abfrage: ${remErr.message}`)

  for (const r of reminders || []) {
    sum.reminders.processed++
    try {
      const appt = r.appointment
      if (!appt || !isBlockingAppointmentStatus(appt.status)) {
        await supabase.from('reminder_jobs').update({ status: 'cancelled' }).eq('id', r.id)
        sum.reminders.cancelled++; continue
      }
      if (!flags.email_sending_enabled || !mailReady) { sum.reminders.skipped++; continue }
      const to = appt.lead?.email || appt.lead_email_snapshot
      if (!to) { await supabase.from('reminder_jobs').update({ status: 'failed', attempts: (r.attempts || 0) + 1, last_error: 'keine E-Mail-Adresse' }).eq('id', r.id); sum.reminders.failed++; continue }
      // Atomares Claiming: nur EIN Runner darf senden (verhindert Doppelversand)
      const { data: claimed } = await supabase.from('reminder_jobs')
        .update({ status: 'sending' }).eq('id', r.id).eq('status', 'pending').select('id').maybeSingle()
      if (!claimed) { continue }
      // Vorlage aus email_templates bevorzugen (im Admin pflegbar), sonst Standardtext.
      const link = appt.assigned?.default_call_link ? `\nLink: ${appt.assigned.default_call_link}` : ''
      let subject = r.type === 'reminder_1h' ? 'Erinnerung: Termin in 1 Stunde'
        : r.type === 'reminder_mid' ? 'Ihr Termin mit HK Growth'
        : 'Erinnerung an unseren Termin morgen'
      let body = `Hallo ${appt.lead?.contact_name || ''},\n\nkurze Erinnerung an unseren Termin:\n${fmt(appt.appointment_at)}${appt.assigned?.full_name ? `\nAnsprechpartner: ${appt.assigned.full_name}` : ''}${link}\n\nBis dann!\nHK Growth`
      try {
        let tpl = null
        for (const tplKey of reminderTemplateKeys(r.type, appt.appointment_type)) {
          const hit = await selectTemplate(supabase, {
            templateKey: tplKey,
            callType: isCloserAppointment(appt.appointment_type) ? 'closer_call' : 'setter_call',
            productArea: 'system',
          })
          if (hit?.id && hit.subject && hit.body_text) { tpl = hit; break }
        }
        if (tpl?.id && tpl.subject && tpl.body_text) {
          const vars: Record<string, string> = {
            contact_first_name: (appt.lead?.contact_name || '').split(' ')[0] || '',
            company_name: appt.lead?.company_name || '',
            appointment_date: fmtDate(appt.appointment_at),
            appointment_time: fmtTime(appt.appointment_at),
            call_link: appt.assigned?.default_call_link || '',
            assigned_setter_name: appt.assigned?.full_name || '',
            assigned_closer_name: appt.assigned?.full_name || '',
            assigned_opener_name: appt.assigned?.full_name || '',
          }
          subject = fillVars(tpl.subject, vars)
          body = fillVars(tpl.body_text, vars)
        }
      } catch { /* Vorlagenfehler darf den Reminder nie brechen */ }

      // Reminder im HK-Design versenden (Header, Termin-Box mit Button, Footer).
      // Plain-Text bleibt als Fallback für Clients ohne HTML.
      let html: string | undefined
      try {
        html = renderHkEmailHtml({
          bodyText: body,
          subject,
          callType: isCloserAppointment(appt.appointment_type) ? 'closer_call' : 'setter_call',
          vars: {
            appointment_date: fmtDate(appt.appointment_at),
            appointment_time: fmtTime(appt.appointment_at),
            zoom_link: appt.assigned?.default_call_link || null,
            expert_name: appt.assigned?.full_name || null,
          },
        })
      } catch { /* ohne HTML wird Plain-Text gesendet */ }

      const res = await sendEmail({ to, subject, body, html })
      if (res.ok) {
        await supabase.from('reminder_jobs').update({ status: 'sent', attempts: (r.attempts || 0) + 1 }).eq('id', r.id).eq('status', 'sending')
        const field = r.type === 'reminder_1h' ? 'reminder_1h_status' : r.type === 'reminder_24h' ? 'reminder_24h_status' : null
        if (field) await supabase.from('appointments').update({ [field]: 'gesendet' }).eq('id', appt.id)
        sum.reminders.sent++
      } else {
        await supabase.from('reminder_jobs').update({ status: 'failed', attempts: (r.attempts || 0) + 1, last_error: res.error }).eq('id', r.id)
        sum.reminders.failed++
      }
    } catch (e: any) {
      await supabase.from('reminder_jobs').update({ status: 'failed', attempts: (r.attempts || 0) + 1, last_error: e?.message || String(e) }).eq('id', r.id)
      sum.reminders.failed++
    }
  }

  // ── 2) Sendbare Mail-Jobs ──────────────────────────────────────────────────
  // approved immer; draft nur wenn auto_send_confirmations aktiv
  const sendableStatuses = flags.auto_send_confirmations ? ['approved', 'draft'] : ['approved']
  const { data: emails, error: mailErr } = await supabase
    .from('email_jobs').select('*')
    .in('status', sendableStatuses).not('to_email', 'is', null).limit(100)
  if (mailErr) sum.errors.push(`Mail-Abfrage: ${mailErr.message}`)

  for (const m of emails || []) {
    if (m.send_at && new Date(m.send_at).getTime() > now.getTime()) continue
    sum.emails.processed++
    try {
      if (!flags.email_sending_enabled || !mailReady) { sum.emails.skipped++; continue }
      // Atomares Claiming gegen Doppelversand
      const { data: claimed } = await supabase.from('email_jobs')
        .update({ status: 'sending' }).eq('id', m.id).in('status', sendableStatuses).select('id').maybeSingle()
      if (!claimed) { continue }
      // Fehlt vorbereitetes HTML (z. B. Info-Mail, No-Show, Onboarding),
      // wird der Text hier ins HK-Design gerendert — nie nackter Text.
      let mailHtml: string | undefined = m.body_html || undefined
      if (!mailHtml) {
        try { mailHtml = renderHkEmailHtml({ bodyText: m.body || '', subject: m.subject || '' }) } catch {}
      }
      const res = await sendEmail({ to: m.to_email, subject: m.subject, body: m.body, html: mailHtml })
      if (res.ok) { await supabase.from('email_jobs').update({ status: 'sent', sent_at: nowIso }).eq('id', m.id).eq('status', 'sending'); sum.emails.sent++ }
      else { await markEmailFailed(supabase, m.id, res.error); sum.emails.failed++ }
    } catch (e: any) {
      await markEmailFailed(supabase, m.id, e?.message || String(e)); sum.emails.failed++
    }
  }

  // ── 3) Offene Calendar-Syncs ───────────────────────────────────────────────
  if (flags.calendar_sync_enabled && gReady) {
    const { data: appts } = await supabase
      .from('appointments').select('id')
      .eq('calendar_sync_status', 'pending').in('status', BLOCKING_APPOINTMENT_STATUSES).limit(25)
    for (const a of appts || []) {
      sum.calendar.processed++
      try {
        const built = await buildCalendarInputFromAppointment(a.id)
        if ('error' in built) { sum.calendar.skipped++; continue }
        const res = await createCalendarEvent(built.input, { lead_id: built.leadId, assigned_user_id: built.assignedUserId })
        if (res.success) sum.calendar.synced++; else sum.calendar.failed++
      } catch { sum.calendar.failed++ }
    }
  }

  // ── 4) Interne Slack-Benachrichtigungen ────────────────────────────────────
  const slackReady = slackConfigured()
  if (flags.slack_notifications_enabled && slackReady) {
    const { data: notes } = await supabase
      .from('internal_notifications')
      .select('*').eq('channel', 'slack').eq('status', 'pending').limit(50)
    for (const n of notes || []) {
      sum.notifications.processed++
      try {
        // Atomares Claiming gegen Doppelversand
        const { data: claimed } = await supabase.from('internal_notifications')
          .update({ status: 'sending' }).eq('id', n.id).eq('status', 'pending').select('id').maybeSingle()
        if (!claimed) continue
        const res = await sendSlack(`*${n.title}*\n${n.body}`)
        if (res.ok) { await supabase.from('internal_notifications').update({ status: 'sent', sent_at: nowIso }).eq('id', n.id); sum.notifications.sent++ }
        else { await supabase.from('internal_notifications').update({ status: 'failed' }).eq('id', n.id); sum.notifications.failed++ }
      } catch {
        await supabase.from('internal_notifications').update({ status: 'failed' }).eq('id', n.id); sum.notifications.failed++
      }
    }
  } else {
    const { count } = await supabase.from('internal_notifications')
      .select('id', { count: 'exact', head: true }).eq('status', 'pending')
    sum.notifications.skipped = count || 0
  }

  // Zusammenfassung loggen
  try {
    await supabase.from('automation_logs').insert({
      action_type: 'job_run', status: 'completed',
      message: `R ${sum.reminders.sent}/${sum.reminders.processed} · M ${sum.emails.sent}/${sum.emails.processed} · C ${sum.calendar.synced}/${sum.calendar.processed} · S ${sum.notifications.sent}/${sum.notifications.processed}`,
      metadata_json: sum as any,
    })
  } catch {}

  return sum
}
