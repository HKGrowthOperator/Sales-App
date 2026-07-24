// ============================================================
// Strukturierte Warnungen + Call-Readiness (Master-Prompt §10)
// ------------------------------------------------------------
// Leitet aus vorhandenen Feldern (approach_notes/Hinweise,
// Geschäftsführung, Kontaktdaten, do_not_contact) strukturierte
// Warnungen mit Schweregrad und einen Readiness-Status ab — ohne
// dass kritische Infos in einem langen Notiztext verschwinden.
// Reines Ableiten (kein DB-Zugriff), nutzbar in Liste/Detail/Dialer.
// ============================================================
import type { Lead } from '@/lib/types'
import { parseDecisionMakers } from '@/lib/leads/decisionMakers'

export type Severity = 'gesperrt' | 'kritisch' | 'pruefen' | 'info'

export interface LeadWarning {
  severity: Severity
  label: string
  detail?: string
}

export type Readiness =
  | 'call_ready'
  | 'research_needed'
  | 'decision_maker_check'
  | 'contact_missing'
  | 'group_check'
  | 'do_not_contact'
  | 'admin_release'

const SEVERITY_RANK: Record<Severity, number> = { gesperrt: 0, kritisch: 1, pruefen: 2, info: 3 }

// Muster im Hinweistext → Warnung.
const PATTERNS: { re: RegExp; severity: Severity; label: string }[] = [
  { re: /nicht\s*(mehr)?\s*ansprechen|nicht\s*kontaktieren|do\s*not\s*contact/i, severity: 'gesperrt', label: 'Nicht ansprechen' },
  { re: /ausgeschieden|nicht mehr (gf|geschäftsführer)|gf.?abgang|geschäftsführer.?wechsel/i, severity: 'kritisch', label: 'Geschäftsführer geprüft/ausgeschieden' },
  { re: /widerspruch|widersprüchlich/i, severity: 'kritisch', label: 'Geschäftsführung widersprüchlich' },
  { re: /wettbewerber|konkurrent|potenzieller wettbewerber/i, severity: 'pruefen', label: 'Potenzieller Wettbewerber' },
  { re: /firmengruppe|nur einen|gruppe mit|nicht mit .* verwechseln|firmengruppe mit/i, severity: 'pruefen', label: 'Firmengruppe – nur einen ansprechen' },
  { re: /über zielgröße|über zielgroesse|zu groß|über der zielgröße/i, severity: 'pruefen', label: 'Über Zielgröße' },
  { re: /rechtsform.*prüfen|rechtsform prüfen|gmbh vor ansprache prüfen/i, severity: 'pruefen', label: 'Rechtsform prüfen' },
  { re: /adresse.*prüfen|adresse prüfen|hausnummer.*prüfen|standort.*prüfen/i, severity: 'pruefen', label: 'Adresse/Standort prüfen' },
  { re: /aktualität.*prüfen|vor anruf prüfen|lage.*prüfen|umstrukturierung/i, severity: 'pruefen', label: 'Aktualität vor Anruf prüfen' },
  { re: /erstrecherche|nur aus erstrecherche|unbestätigt|unbestaetigt/i, severity: 'info', label: 'Daten nur aus Erstrecherche' },
  { re: /veraltet|möglicherweise veraltet/i, severity: 'info', label: 'Daten möglicherweise veraltet' },
]

function isMissing(v: string | null | undefined): boolean {
  if (!v) return true
  const s = String(v).trim().toLowerCase()
  return !s || s === 'n/a' || s === 'na' || s === '-' || s === '–'
}

/** Alle strukturierten Warnungen eines Leads, nach Schweregrad sortiert. */
export function deriveWarnings(lead: Lead): LeadWarning[] {
  const warnings: LeadWarning[] = []
  const hints = [lead.approach_notes, lead.relevance_reason, lead.next_step]
    .filter(Boolean).join(' · ')

  for (const p of PATTERNS) {
    if (p.re.test(hints)) warnings.push({ severity: p.severity, label: p.label })
  }
  if (lead.do_not_contact) {
    if (!warnings.some(w => w.severity === 'gesperrt')) {
      warnings.push({ severity: 'gesperrt', label: 'Nicht ansprechen', detail: lead.opt_out_reason || undefined })
    }
  }

  // Kontaktdaten
  if (isMissing(lead.phone) && isMissing(lead.email)) {
    warnings.push({ severity: 'kritisch', label: 'Kontaktdaten fehlen' })
  } else if (isMissing(lead.phone)) {
    warnings.push({ severity: 'pruefen', label: 'Keine Telefonnummer' })
  }

  // Entscheider
  const dm = parseDecisionMakers(lead.management)
  if (dm.hasConflict) warnings.push({ severity: 'kritisch', label: 'Entscheider prüfen (widersprüchlich)' })
  else if (dm.people.length > 1) warnings.push({ severity: 'info', label: 'Mehrere mögliche Entscheider' })
  else if (dm.people.length === 0 && isMissing(lead.contact_name)) warnings.push({ severity: 'info', label: 'Ansprechpartner noch nicht ermittelt' })

  // dedupe + sortieren
  const seen = new Set<string>()
  return warnings
    .filter(w => (seen.has(w.label) ? false : (seen.add(w.label), true)))
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
}

/** Höchster Schweregrad (für Badges). */
export function topSeverity(warnings: LeadWarning[]): Severity | null {
  if (!warnings.length) return null
  return warnings.reduce((acc, w) => (SEVERITY_RANK[w.severity] < SEVERITY_RANK[acc] ? w.severity : acc), warnings[0].severity)
}

/** Ableitung des Readiness-Status aus Lead + Warnungen. */
export function callReadiness(lead: Lead, warnings?: LeadWarning[]): Readiness {
  const w = warnings || deriveWarnings(lead)
  if (w.some(x => x.severity === 'gesperrt') || lead.do_not_contact) return 'do_not_contact'
  if (w.some(x => x.label.startsWith('Kontaktdaten fehlen'))) return 'contact_missing'
  if (w.some(x => x.label.startsWith('Firmengruppe'))) return 'group_check'
  if (w.some(x => x.severity === 'kritisch')) return 'decision_maker_check'
  return 'call_ready'
}

export const READINESS_LABEL: Record<Readiness, string> = {
  call_ready: 'Call-ready',
  research_needed: 'Research erforderlich',
  decision_maker_check: 'Prüfen vor Anruf',
  contact_missing: 'Kontaktdaten fehlen',
  group_check: 'Firmengruppe prüfen',
  do_not_contact: 'Nicht ansprechen',
  admin_release: 'Admin-Freigabe erforderlich',
}

export const SEVERITY_STYLE: Record<Severity, string> = {
  gesperrt: 'bg-zinc-800 text-white border-zinc-800',
  kritisch: 'bg-red-50 text-red-700 border-red-300',
  pruefen: 'bg-amber-50 text-amber-700 border-amber-300',
  info: 'bg-slate-50 text-slate-600 border-slate-200',
}

export const READINESS_STYLE: Record<Readiness, string> = {
  call_ready: 'bg-green-100 text-green-700',
  research_needed: 'bg-blue-100 text-blue-700',
  decision_maker_check: 'bg-amber-100 text-amber-700',
  contact_missing: 'bg-red-100 text-red-700',
  group_check: 'bg-amber-100 text-amber-700',
  do_not_contact: 'bg-zinc-800 text-white',
  admin_release: 'bg-purple-100 text-purple-700',
}
