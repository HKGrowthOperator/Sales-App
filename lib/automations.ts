// ============================================================
// Automations bei Call-Notiz-Speichern (Automationslogik.md)
// Zentrale Kaskade: Leadstatus, letzte Notiz, Follow-up,
// Termin-Datensatz, Mail-Preview-Bereitschaft, Opt-out.
// Wird von CallNoteForm (Opener/Setter/Closer) aufgerufen.
// ============================================================
import { Lead, Profile, CallResult, RoleContext, LeadStatus, LeadScore } from '@/lib/types'
import { selectTemplate, productAreaFromEntryAngle } from '@/lib/email/templates'
import { buildSalutation } from '@/lib/email/salutation'

/** Holt Betreff/Text aus einer Admin-Vorlage; null, wenn keine gepflegt ist. */
async function templateMail(
  supabase: any,
  templateKey: string,
  lead: Lead,
  profile: Profile,
): Promise<{ subject: string; body: string } | null> {
  try {
    const tpl = await selectTemplate(supabase, {
      templateKey,
      callType: 'setter_call',
      productArea: productAreaFromEntryAngle(lead.entry_angle),
    })
    if (!tpl?.id || !tpl.subject || !tpl.body_text) return null
    const vars: Record<string, string> = {
      contact_first_name: (lead.contact_name || '').split(' ')[0] || '',
      contact_salutation: buildSalutation(lead as any) || (lead.contact_name || ''),
      contact_name: lead.contact_name || '',
      company_name: lead.company_name || '',
      assigned_opener_name: profile.full_name || 'HK Growth Operator',
      assigned_setter_name: profile.full_name || 'HK Growth Operator',
      assigned_closer_name: profile.full_name || 'HK Growth Operator',
    }
    const fill = (s: string) => s.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => vars[k] ?? '')
    return { subject: fill(tpl.subject), body: fill(tpl.body_text) }
  } catch {
    return null
  }
}

// Welcher Lead-Status folgt aus Rolle + Call-Ergebnis
function nextStatusFor(role: RoleContext, result: CallResult): LeadStatus | null {
  if (result === 'Nicht mehr kontaktieren') return 'Nicht mehr kontaktieren'
  if (result === 'Später erneut kontaktieren') return 'Später erneut kontaktieren'
  if (result === 'Nicht passend') return 'Nicht passend'

  if (role === 'Opener') {
    const map: Partial<Record<CallResult, LeadStatus>> = {
      'Nicht erreicht': 'Nicht erreicht',
      'Falscher Ansprechpartner': 'Zu kontaktieren',
      'Kein Interesse': 'Kontaktiert',          // ≠ Nicht passend: bleibt kontaktierbar
      'Interessiert': 'Interessiert',
      'Rückruf gewünscht': 'Follow-up',
      'Rückruf vereinbart': 'Follow-up',
      'Termin vereinbart': 'Setter-Call geplant',
    }
    return map[result] ?? 'Kontaktiert'
  }
  if (role === 'Setter') {
    const map: Partial<Record<CallResult, LeadStatus>> = {
      'Qualifiziert für Closer': 'Closer-Call geplant',
      'Termin vereinbart': 'Closer-Call geplant',
      'Noch nicht qualifiziert': 'Interessiert',
      'Follow-up nötig': 'Follow-up',
      'Kein Entscheider': 'Follow-up',
      'Timing später': 'Später erneut kontaktieren',
      'Kein echter Pain': 'Nicht passend',
    }
    return map[result] ?? 'Setter-Call geplant'
  }
  // Closer
  const map: Partial<Record<CallResult, LeadStatus>> = {
    'Angebot vorbereiten': 'Angebot vorbereiten',
    'Angebot gesendet': 'Angebot gesendet',
    'Follow-up': 'Follow-up',
    'Rückruf vereinbart': 'Follow-up',
    'Gewonnen': 'Gewonnen',
    'Verloren': 'Verloren',
  }
  return map[result] ?? null
}

// Ergebnisse, die eine Wiedervorlage (Follow-up) erzeugen
const FOLLOWUP_RESULTS: CallResult[] = [
  'Rückruf vereinbart', 'Rückruf gewünscht', 'Follow-up', 'Follow-up nötig',
  'Kein Entscheider', 'Nicht erreicht',
]

export interface CallNoteAutomationInput {
  supabase: any
  lead: Lead
  profile: Profile
  role: RoleContext
  result: CallResult
  rawNote: string
  nextStep?: string | null
  score?: LeadScore | null
  decisionMakerStatus?: string | null
  appointmentAt?: string | null       // ISO-String, falls Termin vereinbart
  customerEmail?: string | null
  attendees?: string[] | null
  followupDays?: number               // Standard-Wiedervorlage-Abstand
}

export interface AutomationResult {
  status: LeadStatus | null
  followupCreated: boolean
  appointmentId: string | null
  mailPreviewReady: boolean
  optedOut: boolean
}

export async function runCallNoteAutomations(input: CallNoteAutomationInput): Promise<AutomationResult> {
  const {
    supabase, lead, profile, role, result, rawNote,
    nextStep, score, decisionMakerStatus, appointmentAt, customerEmail, attendees,
  } = input

  const now = new Date()
  const status = nextStatusFor(role, result)
  const optedOut = result === 'Nicht mehr kontaktieren'

  let followupCreated = false
  let appointmentId: string | null = null
  let mailPreviewReady = false

  // ── 1. Follow-up / Wiedervorlage ───────────────────────────────────────────
  let followupAt: string | null = null
  if (FOLLOWUP_RESULTS.includes(result) && !optedOut) {
    const days = input.followupDays ?? (role === 'Opener' ? 3 : 7)
    const due = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    followupAt = due.toISOString()
    const { error } = await supabase.from('followups').insert({
      lead_id: lead.id,
      assigned_to: lead.assigned_to || profile.id,
      role_type: role.toLowerCase(),
      due_at: followupAt,
      type: 'Anruf',
      reason: `Nach Call: ${result}`,
      created_from_event: 'CALL_LOGGED',
      note: rawNote?.slice(0, 300) || `Wiedervorlage nach „${result}"`,
      status: 'offen',
    })
    if (!error) followupCreated = true
  }

  // ── 2. (Termin-Buchung läuft AUSSCHLIESSLICH über bookAppointment —
  //        Scheduling-Engine mit Doppelbuchungsschutz. Hier bewusst nichts.)

  // ── 3. Lead aktualisieren (Status, letzte Notiz, Score, next_step, Daten) ──
  const leadUpdate: Record<string, any> = {
    last_contact_at: now.toISOString(),
    last_note: (rawNote || result).slice(0, 200),
    updated_at: now.toISOString(),
  }
  if (status) leadUpdate.status = status
  if (score) leadUpdate.lead_score = score
  if (nextStep) leadUpdate.next_step = nextStep
  if (decisionMakerStatus) leadUpdate.decision_maker_status = decisionMakerStatus
  if (followupAt) leadUpdate.followup_at = followupAt
  if (appointmentAt) leadUpdate.appointment_at = appointmentAt
  if (optedOut) { leadUpdate.opt_out_at = now.toISOString(); leadUpdate.opt_out_reason = rawNote?.slice(0, 200) || 'Opt-out im Call' }
  // do_not_contact wird durch DB-Trigger gesetzt, wenn status='Nicht mehr kontaktieren'

  await supabase.from('leads').update(leadUpdate).eq('id', lead.id)

  // ── 4. Audit-Log + KPI (analog zur Booking-Kaskade) ────────────────────────
  const logs: any[] = [
    { lead_id: lead.id, event_type: 'CALL_LOGGED', action_type: 'call_logged', status: 'completed', message: `${role}: ${result}` },
  ]
  if (status) logs.push({ lead_id: lead.id, event_type: 'CALL_LOGGED', action_type: 'lead_status_updated', status: 'completed', message: status })
  if (followupCreated) logs.push({ lead_id: lead.id, event_type: 'CALL_LOGGED', action_type: 'follow_up_created', status: 'completed', message: `Wiedervorlage ${followupAt}` })
  if (optedOut) logs.push({ lead_id: lead.id, event_type: 'OPT_OUT', action_type: 'opt_out', status: 'completed', message: rawNote?.slice(0, 200) || 'Opt-out' })
  try { await supabase.from('automation_logs').insert(logs) } catch {}

  // KPI: immer ein call-Event, plus business-relevante Spezialfälle
  const kpis: any[] = [
    { lead_id: lead.id, actor_user_id: profile.id, role_type: role.toLowerCase(), event_type: 'call_logged', metadata_json: { result } },
  ]
  if (optedOut) kpis.push({ lead_id: lead.id, actor_user_id: profile.id, role_type: role.toLowerCase(), event_type: 'opt_out', metadata_json: {} })
  if (result === 'Gewonnen') kpis.push({ lead_id: lead.id, actor_user_id: profile.id, role_type: role.toLowerCase(), event_type: 'deal_won', metadata_json: {} })
  if (result === 'Verloren') kpis.push({ lead_id: lead.id, actor_user_id: profile.id, role_type: role.toLowerCase(), event_type: 'deal_lost', metadata_json: {} })
  if (result === 'Nicht passend' || result === 'Kein echter Pain') kpis.push({ lead_id: lead.id, actor_user_id: profile.id, role_type: role.toLowerCase(), event_type: 'no_fit', metadata_json: {} })
  try { await supabase.from('kpi_events').insert(kpis) } catch {}

  // ── 4b. Interessiert → Info-/Nurture-Mail als Draft (kein Blindversand) ────
  //   Öffnet sofort einen review-fertigen Mail-Entwurf im Mail-Preview-Postfach,
  //   sobald ein Opener/Setter "Interessiert" protokolliert. Ohne E-Mail wird der
  //   Draft als blocked_missing_email markiert. Versand erst nach Freigabe (Runner).
  if (result === 'Interessiert') {
    const to = lead.email || null
    const firstName = (lead.contact_name || '').split(' ')[0]
    // Nutzt dieselbe gepflegte Info-Mail wie der Dialer-Pfad „Schicken Sie mir Infos".
    const tpl = await templateMail(supabase, 'HK-SALES-INFO-MAIL', lead, profile)
    const subject = tpl?.subject || 'HK Growth Operator – Ihre nächsten Schritte'
    const body = tpl?.body
      || `Hallo ${firstName || ''},\n\nvielen Dank für das kurze Gespräch. Wie besprochen schicke ich Ihnen die Unterlagen.\n\nFür die nächsten Schritte schlage ich ein kurzes, unverbindliches Gespräch vor, in dem wir konkret auf Ihre Situation schauen.\n\nBeste Grüße\n${profile.full_name || 'HK Growth Operator'}`
    try {
      await supabase.from('email_jobs').insert({
        lead_id: lead.id, type: 'nurture', to_email: to,
        subject, body,
        status: to ? 'draft' : 'blocked_missing_email',
        created_from_event: 'LEAD_INTERESTED', created_by: profile.id,
      })
    } catch {}
  }

  // ── 5. Gewonnen → Onboarding-Mail-Preview (kein Blindversand) ──────────────
  if (result === 'Gewonnen') {
    const to = lead.email || null
    const tpl = await templateMail(supabase, 'HK-SALES-ONBOARDING', lead, profile)
    const subject = tpl?.subject || 'Willkommen bei HK Growth Operator'
    const body = tpl?.body
      || `Hallo ${(lead.contact_name || '').split(' ')[0] || ''},\n\nherzlich willkommen bei HK Growth Operator — wir freuen uns auf die Zusammenarbeit.\n\nAls nächste Schritte melden wir uns für das Onboarding:\n- Prozessaufnahme\n- Zugänge und Materialien klären\n- Fahrplan für die ersten Wochen\n\nBeste Grüße\n${profile.full_name || 'HK Growth Operator'}`
    try {
      await supabase.from('email_jobs').insert({
        lead_id: lead.id, type: 'onboarding', to_email: to,
        subject, body,
        status: to ? 'draft' : 'blocked_missing_email',
        created_from_event: 'DEAL_WON', created_by: profile.id,
      })
    } catch {}
  }

  return { status, followupCreated, appointmentId, mailPreviewReady, optedOut }
}
