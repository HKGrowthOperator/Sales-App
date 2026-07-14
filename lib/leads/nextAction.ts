// ============================================================
// Leitet aus Lead-Status, Appointments und Follow-ups die EINE
// nächste Aktion ab. Reine Funktion, keine Businesslogik-Mutation.
// ============================================================
import { isBlockingAppointmentStatus } from '@/lib/scheduling/status'

export type NextActionSeverity = 'urgent' | 'today' | 'upcoming' | 'blocked' | 'closed'

export interface NextAction {
  type: string
  label: string
  dueAt: string | null
  assignedUser: string | null
  severity: NextActionSeverity
  actionHref: string | null
}

interface ApptLite { id: string; appointment_type: string; status: string; appointment_at: string; assigned_user_id?: string | null; assigned_name?: string | null }
interface FupLite { due_at: string; status: string; reason?: string | null }
interface LeadLite { id: string; status: string; do_not_contact?: boolean; next_step?: string | null }

const fmt = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
const isToday = (iso: string, now: Date) => {
  const d = new Date(iso)
  return d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }) === now.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })
}

export function deriveLeadNextAction(
  { lead, appointments = [], followups = [], now = new Date() }:
  { lead: LeadLite; appointments?: ApptLite[]; followups?: FupLite[]; now?: Date }
): NextAction {
  // 1. Geschlossene Zustände
  if (lead.do_not_contact || lead.status === 'Nicht mehr kontaktieren')
    return { type: 'opt_out', label: 'Opt-out — nicht mehr kontaktieren', dueAt: null, assignedUser: null, severity: 'closed', actionHref: null }
  if (lead.status === 'Gewonnen')
    return { type: 'won', label: 'Gewonnen — Onboarding offen', dueAt: null, assignedUser: null, severity: 'closed', actionHref: null }
  if (lead.status === 'Verloren')
    return { type: 'lost', label: 'Verloren', dueAt: null, assignedUser: null, severity: 'closed', actionHref: null }
  if (lead.status === 'Nicht passend')
    return { type: 'no_fit', label: 'No-Fit', dueAt: null, assignedUser: null, severity: 'closed', actionHref: null }

  // 2. Überfälliger offener Follow-up = dringend
  const openFups = followups.filter(f => f.status === 'offen').sort((a, b) => a.due_at.localeCompare(b.due_at))
  const overdueFup = openFups.find(f => new Date(f.due_at).getTime() < now.getTime())
  if (overdueFup)
    return { type: 'followup_overdue', label: `Follow-up überfällig seit ${fmt(overdueFup.due_at)}`, dueAt: overdueFup.due_at, assignedUser: null, severity: 'urgent', actionHref: null }

  // 3. Nächster aktiver Termin
  const futureAppts = appointments
    .filter(a => isBlockingAppointmentStatus(a.status) && new Date(a.appointment_at).getTime() >= now.getTime() - 3600e3)
    .sort((a, b) => a.appointment_at.localeCompare(b.appointment_at))
  if (futureAppts.length) {
    const a = futureAppts[0]
    const who = a.assigned_name ? ` mit ${a.assigned_name}` : ''
    return {
      type: 'appointment', label: `${a.appointment_type}${who} am ${fmt(a.appointment_at)}`,
      dueAt: a.appointment_at, assignedUser: a.assigned_name || null,
      severity: isToday(a.appointment_at, now) ? 'today' : 'upcoming', actionHref: null,
    }
  }

  // 4. Offener Follow-up heute/künftig
  if (openFups.length) {
    const f = openFups[0]
    return { type: 'followup', label: `Follow-up fällig ${fmt(f.due_at)}`, dueAt: f.due_at, assignedUser: null, severity: isToday(f.due_at, now) ? 'today' : 'upcoming', actionHref: null }
  }

  // 5. Aus Status abgeleitet
  const byStatus: Record<string, { label: string; severity: NextActionSeverity }> = {
    'Neu': { label: 'Erstkontakt — heute anrufen', severity: 'today' },
    'Zu kontaktieren': { label: 'Heute anrufen', severity: 'today' },
    'Nicht erreicht': { label: 'Erneut anrufen', severity: 'today' },
    'Kontaktiert': { label: 'Dranbleiben / nächsten Versuch planen', severity: 'today' },
    'Interessiert': { label: 'Setter-Call planen', severity: 'today' },
    'Setter-Call geplant': { label: 'Setter-Call durchführen', severity: 'upcoming' },
    'Setter qualifiziert': { label: 'Closer-Call planen', severity: 'today' },
    'Closer-Call geplant': { label: 'Closer-Call durchführen', severity: 'upcoming' },
    'Angebot vorbereiten': { label: 'Angebot vorbereiten', severity: 'today' },
    'Angebot gesendet': { label: 'Angebot nachfassen', severity: 'today' },
    'Follow-up': { label: lead.next_step || 'Follow-up durchführen', severity: 'today' },
    'Später erneut kontaktieren': { label: 'Später erneut kontaktieren', severity: 'upcoming' },
  }
  const s = byStatus[lead.status]
  if (s) return { type: 'status', label: s.label, dueAt: null, assignedUser: null, severity: s.severity, actionHref: null }

  return { type: 'review', label: lead.next_step || 'Nächsten Schritt festlegen', dueAt: null, assignedUser: null, severity: 'upcoming', actionHref: null }
}

export const SEVERITY_STYLE: Record<NextActionSeverity, { cls: string; dot: string }> = {
  urgent:   { cls: 'bg-red-600 text-white', dot: 'bg-red-300' },
  today:    { cls: 'bg-blue-600 text-white', dot: 'bg-blue-300' },
  upcoming: { cls: 'bg-slate-700 text-white', dot: 'bg-slate-400' },
  blocked:  { cls: 'bg-amber-500 text-white', dot: 'bg-amber-200' },
  closed:   { cls: 'bg-slate-200 text-slate-600', dot: 'bg-slate-400' },
}
