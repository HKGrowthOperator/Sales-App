// ============================================================
// Führt alle Lead-Ereignisse aus den vorhandenen Tabellen zu EINER
// chronologischen, menschlich lesbaren Timeline zusammen.
// Keine neue Logik — nur Lesen + Formatieren.
// ============================================================

export type TimelineTone = 'default' | 'success' | 'warn' | 'error'
export interface TimelineEvent {
  id: string
  ts: string
  icon: string
  title: string
  detail?: string | null
  actor?: string | null
  tone: TimelineTone
}

const fmt = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

export interface TimelineSources {
  lead: any
  callNotes?: any[]
  appointments?: any[]
  followups?: any[]
  emailJobs?: any[]
  reminderJobs?: any[]
  automationLogs?: any[]
}

export function buildLeadTimeline(s: TimelineSources): TimelineEvent[] {
  const ev: TimelineEvent[] = []

  if (s.lead?.created_at)
    ev.push({ id: `lead-${s.lead.id}`, ts: s.lead.created_at, icon: 'lead', title: 'Lead erstellt', tone: 'default' })

  if (s.lead?.lead_source === 'Lead Radar')
    ev.push({
      id: `radar-${s.lead.id}`, ts: s.lead.created_at, icon: 'radar',
      title: 'Vom Lead Radar übernommen',
      detail: s.lead.radar_analysis || s.lead.opener_pitch || null, tone: 'default',
    })

  for (const n of s.callNotes || []) {
    ev.push({
      id: `note-${n.id}`, ts: n.created_at, icon: 'note',
      title: `${n.role_context}: ${n.call_result || 'Notiz'}`,
      detail: n.raw_note || n.structured_summary || null,
      actor: n.user?.full_name || null, tone: 'default',
    })
  }

  for (const a of s.appointments || []) {
    const who = a.assigned_name ? ` mit ${a.assigned_name}` : ''
    ev.push({ id: `appt-${a.id}`, ts: a.created_at, icon: 'calendar', title: `${a.appointment_type} gebucht${who}`, detail: `für ${fmt(a.appointment_at)}`, tone: 'default' })
    if (a.cancelled_at) ev.push({ id: `appt-c-${a.id}`, ts: a.cancelled_at, icon: 'calendar-x', title: `${a.appointment_type} abgesagt`, tone: 'warn' })
    if (a.no_show_at) ev.push({ id: `appt-n-${a.id}`, ts: a.no_show_at, icon: 'user-x', title: `${a.appointment_type}: No-Show`, tone: 'error' })
    if (a.completed_at) ev.push({ id: `appt-d-${a.id}`, ts: a.completed_at, icon: 'check', title: `${a.appointment_type} erledigt`, tone: 'success' })
  }

  for (const f of s.followups || []) {
    ev.push({ id: `fup-${f.id}`, ts: f.created_at, icon: 'followup', title: `Follow-up gesetzt${f.reason ? ` (${f.reason})` : ''}`, detail: `fällig ${fmt(f.due_at)}`, tone: 'default' })
    if (f.completed_at) ev.push({ id: `fup-d-${f.id}`, ts: f.completed_at, icon: 'check', title: 'Follow-up erledigt', tone: 'success' })
  }

  for (const m of s.emailJobs || []) {
    const blocked = m.status === 'blocked_missing_email'
    ev.push({ id: `mail-${m.id}`, ts: m.created_at, icon: 'mail', title: `Mail-Preview: ${m.subject}`, detail: blocked ? 'blockiert — keine E-Mail-Adresse' : `Status: ${m.status}`, tone: blocked ? 'warn' : 'default' })
  }

  for (const r of s.reminderJobs || []) {
    ev.push({ id: `rem-${r.id}`, ts: r.created_at, icon: 'bell', title: `Reminder ${r.type} vorbereitet`, detail: `für ${fmt(r.send_at)}${r.status !== 'pending' ? ` · ${r.status}` : ''}`, tone: r.status === 'failed' ? 'error' : 'default' })
  }

  for (const log of s.automationLogs || []) {
    const failed = log.status === 'failed' || log.action_type === 'sync_failed'
    if (log.action_type === 'appointment_rescheduled') {
      ev.push({ id: `log-${log.id}`, ts: log.created_at, icon: 'calendar', title: 'Termin verschoben', detail: log.message || null, tone: 'default' })
    } else if (failed) {
      ev.push({ id: `log-${log.id}`, ts: log.created_at, icon: 'alert', title: `Automation fehlgeschlagen: ${log.action_type}`, detail: log.message || null, tone: 'error' })
    }
  }

  return ev.sort((a, b) => b.ts.localeCompare(a.ts))
}
