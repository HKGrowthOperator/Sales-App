// Typen für den Lead-Contract (Implementierung in leadContract.mjs).
// Festes Ausgabeformat des Radars für ein externes Empfänger-System.

export type LeadStatus = 'neu' | 'qualifiziert' | 'uebergeben'

export interface LeadContract {
  /** Eindeutige ID (UUID, vom Radar vergeben). */
  lead_id: string
  /** Erstellzeitpunkt, ISO 8601. */
  timestamp: string
  /** Herkunft des Leads. */
  source: string
  /** Lebenszyklus: neu → qualifiziert → uebergeben. */
  status: LeadStatus
  company: {
    name: string
    domain: string
    branche: string
    groesse: string
    ort: string
  }
  kontakt: {
    name: string
    rolle: string
    email: string
    telefon: string
  }
  signale: {
    /** Auslöser/Pain, der den Lead interessant macht. */
    trigger: string
    /** Lead-Score 0–100. */
    score: number
    /** Welche Qualifizierungskriterien erfüllt sind. */
    matched_kriterien: string[]
  }
  meta: {
    notiz: string
    /** Roh-Lead, wie ihn das Radar geliefert hat. */
    raw: Record<string, unknown>
  }
}

export interface ToLeadContractOptions {
  lead_id?: string
  timestamp?: string
  source?: string
  includeRaw?: boolean
}

export const QUALIFY_MIN_SCORE: number
export const QUALIFY_CRITERIA: ReadonlyArray<{
  key: string
  test: (lead: LeadContract, score: number) => boolean
}>

/** Mappt einen nativen Radar-Lead (IngestLead-Form) auf den Lead-Contract. */
export function toLeadContract(input: unknown, opts?: ToLeadContractOptions): LeadContract

/** True, wenn der Lead-Contract als "qualifiziert" markiert ist. */
export function isLeadQualified(leadContract: Partial<LeadContract> | null | undefined): boolean
