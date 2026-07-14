import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { logIntegration, updateLog } from './log'
import { CalendarEventInput, CalendarEventResult } from './types'

// ============================================================
// Auth — OAuth2 mit gespeichertem Refresh Token
// Für Setup-Anleitung: GOOGLE_CALENDAR_SETUP.md
// ============================================================
function getCalendarClient() {
  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Google Calendar nicht konfiguriert. ' +
      'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET und GOOGLE_REFRESH_TOKEN müssen in .env.local gesetzt sein. ' +
      'Siehe GOOGLE_CALENDAR_SETUP.md.'
    )
  }

  const auth = new google.auth.OAuth2(clientId, clientSecret)
  auth.setCredentials({ refresh_token: refreshToken })

  return google.calendar({ version: 'v3', auth })
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ============================================================
// Event-Beschreibung aufbauen
// ============================================================
function buildEventDescription(input: CalendarEventInput): string {
  const lines: string[] = []

  lines.push('━━━ LEAD-INFORMATIONEN ━━━')
  lines.push(`Unternehmen: ${input.company_name}`)
  if (input.contact_name) lines.push(`Ansprechpartner: ${input.contact_name}${input.role_title ? ` (${input.role_title})` : ''}`)
  if (input.phone) lines.push(`Telefon: ${input.phone}`)
  if (input.email) lines.push(`E-Mail: ${input.email}`)
  if (input.website) lines.push(`Website: ${input.website}`)

  if (input.pain_guess) {
    lines.push('')
    lines.push('━━━ PAIN / HAUPTPROBLEM ━━━')
    lines.push(input.pain_guess)
  }

  if (input.entry_angle) {
    lines.push('')
    lines.push(`HK-Hebel: ${input.entry_angle}`)
  }

  if (input.interest_topics && input.interest_topics.length > 0) {
    lines.push(`Interesse an: ${input.interest_topics.join(', ')}`)
  }

  if (input.decision_makers_needed) {
    lines.push('')
    lines.push('━━━ ENTSCHEIDER ━━━')
    lines.push(input.decision_makers_needed)
  }

  if (input.opener_note) {
    lines.push('')
    lines.push('━━━ OPENER-NOTIZ ━━━')
    lines.push(input.opener_note)
  }

  if (input.setter_summary) {
    lines.push('')
    lines.push('━━━ SETTER-QUALIFIZIERUNG ━━━')
    lines.push(input.setter_summary)
  } else if (input.setter_note) {
    lines.push('')
    lines.push('━━━ SETTER-NOTIZ ━━━')
    lines.push(input.setter_note)
  }

  if (input.notes) {
    lines.push('')
    lines.push('━━━ HINWEISE ━━━')
    lines.push(input.notes)
  }

  lines.push('')
  lines.push('━━━ WICHTIG ━━━')
  lines.push('Closer-Call nur mit allen relevanten Entscheidern führen.')
  lines.push('Erstellt von HK Sales Cockpit.')

  return lines.join('\n')
}

// ============================================================
// Google Calendar Event erstellen
// ============================================================
export async function createCalendarEvent(
  input: CalendarEventInput,
  context: { lead_id?: string; user_id?: string }
): Promise<CalendarEventResult> {
  const logId = await logIntegration({
    event_type:     'calendar.create_event',
    system:         'google_calendar',
    status:         'pending',
    lead_id:        context.lead_id,
    user_id:        context.user_id,
    appointment_id: input.appointment_id,
    payload: {
      company_name:     input.company_name,
      appointment_type: input.appointment_type,
      appointment_at:   input.appointment_at,
    },
  })

  try {
    const calendar    = getCalendarClient()
    const calendarId  = process.env.GOOGLE_CALENDAR_ID || 'primary'
    const description = buildEventDescription(input)

    // Teilnehmer: immer den Kunden, falls E-Mail vorhanden
    const attendees: { email: string }[] = []
    if (input.customer_email) {
      attendees.push({ email: input.customer_email })
    }

    // Titel-Format: "HK Closer-Call – DataFlow Consulting – Luis"
    const title = `HK ${input.appointment_type} – ${input.company_name}${input.closer_name ? ` – ${input.closer_name}` : ''}`

    const event = await calendar.events.insert({
      calendarId,
      sendUpdates: 'all', // sendet Einladungs-E-Mails an Teilnehmer
      requestBody: {
        summary:     title,
        description,
        start: {
          dateTime: input.appointment_at,
          timeZone: 'Europe/Berlin',
        },
        end: {
          // Standard: 60 Minuten Dauer
          dateTime: new Date(
            new Date(input.appointment_at).getTime() + 60 * 60 * 1000
          ).toISOString(),
          timeZone: 'Europe/Berlin',
        },
        attendees,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email',  minutes: 24 * 60 },
            { method: 'popup',  minutes: 60 },
          ],
        },
        conferenceData: undefined, // kein automatisches Meet — wir steuern das manuell
      },
    })

    const calendarEventId = event.data.id!

    // Appointment in Supabase updaten
    const supabase = getServiceClient()
    await supabase
      .from('appointments')
      .update({
        calendar_event_id:    calendarEventId,
        calendar_sync_status: 'synced',
      })
      .eq('id', input.appointment_id)

    if (logId) {
      await updateLog(logId, {
        status:   'success',
        response: { calendar_event_id: calendarEventId, html_link: event.data.htmlLink },
      })
    }

    return { success: true, calendar_event_id: calendarEventId }

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)

    // Appointment-Status auf failed setzen
    try {
      const supabase = getServiceClient()
      await supabase
        .from('appointments')
        .update({ calendar_sync_status: 'failed' })
        .eq('id', input.appointment_id)
    } catch (_) {}

    if (logId) {
      await updateLog(logId, {
        status:    'failed',
        error_msg: errorMsg,
      })
    }

    return { success: false, error: errorMsg }
  }
}

// ============================================================
// Appointment + Lead aus Supabase laden und Event-Input bauen
// ============================================================
export async function buildCalendarInputFromAppointment(
  appointmentId: string
): Promise<{ input: CalendarEventInput; leadId: string } | { error: string }> {
  const supabase = getServiceClient()

  const { data: appt, error: apptErr } = await supabase
    .from('appointments')
    .select(`
      *,
      lead:leads(
        *,
        call_notes(*),
        closer_profile:profiles!appointments_closer_fkey(full_name, email)
      )
    `)
    .eq('id', appointmentId)
    .single()

  if (apptErr || !appt) {
    return { error: apptErr?.message || 'Appointment nicht gefunden' }
  }

  // Idempotenz-Check: bereits gesynct?
  if (appt.calendar_event_id && appt.calendar_sync_status === 'synced') {
    return { error: `Bereits in Google Calendar (${appt.calendar_event_id})` }
  }

  const lead      = appt.lead as any
  const callNotes = lead?.call_notes as any[] || []
  const openerNote = callNotes
    .filter((n: any) => n.role_context === 'Opener')
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  const setterNote = callNotes
    .filter((n: any) => n.role_context === 'Setter')
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  const closerProfile = appt.lead?.closer_profile as any

  return {
    leadId: lead?.id,
    input: {
      appointment_id:        appt.id,
      appointment_type:      appt.appointment_type,
      appointment_at:        appt.appointment_at,
      company_name:          lead?.company_name || 'Unbekannt',
      contact_name:          lead?.contact_name ?? null,
      role_title:            lead?.role_title ?? null,
      phone:                 lead?.phone ?? null,
      email:                 lead?.email ?? null,
      website:               lead?.website ?? null,
      pain_guess:            lead?.pain_guess ?? null,
      entry_angle:           lead?.entry_angle ?? null,
      closer_name:           closerProfile?.full_name ?? null,
      customer_email:        appt.customer_email ?? null,
      attendees:             appt.attendees ?? null,
      opener_note:           openerNote?.raw_note ?? null,
      setter_note:           setterNote?.raw_note ?? null,
      setter_summary:        setterNote?.structured_summary ?? null,
      interest_topics:       setterNote?.interest_topics ?? null,
      decision_makers_needed: setterNote?.decision_makers_needed ?? null,
      notes:                 appt.notes ?? null,
    },
  }
}
