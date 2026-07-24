// ============================================================
// Ingest-Contract — Mapping Radar-Lead → radar_targets-Zeile.
// (Rekonstruiert nach RADAR_INGEST_API.md; Schnittstelle wie von
//  app/api/leads/ingest/route.ts erwartet.)
// ------------------------------------------------------------
// Robustheit: Scores werden geclamped (1–10 / 0–100 / 0–1),
// unpassende Enums → null bzw. 'unbekannt', unbekannte
// product_areas werden gefiltert. Pflicht: company_name +
// berechenbarer dedup_key (Domain vor Telefon, autoritativ hier).
// ============================================================
import { computeDedupKey } from '@/lib/radar/dedup'

export interface IngestLead {
  dedup_key?: string | null
  company_name?: string | null
  industry?: string | null
  city?: string | null
  website?: string | null
  social_url?: string | null
  linkedin?: string | null
  google_maps_url?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  decision_maker?: {
    name?: string | null
    role?: string | null
    reachability?: string | null
    note?: string | null
  } | null
  scores?: {
    website?: number | null
    social?: number | null
    ai?: number | null
    soul_fit?: number | null
    lead_score?: number | null
    overall?: string | null
    priority?: string | null
    confidence?: number | null
  } | null
  product_areas?: string[] | null
  recommended_offer?: string | null
  recommended_module_keys?: string[] | null
  pain_summary?: string | null
  detected_weakness?: string | null
  opener_pitch?: string | null
  setter_context?: string | null
  closer_context?: string | null
  sources?: string[] | null
  sales_readiness?: string | null
  scanned_at?: string | null
  // Reichhaltige, lead-only Felder (z.B. aus der Wachstumssystem-Liste).
  // Landen NICHT in radar_targets, sondern direkt am erzeugten Lead.
  cluster?: string | null
  employee_count?: string | null
  management?: string | null
  owner_led?: string | null
  package_potential?: string | null
  cross_sell_score?: number | string | null
  key_bottlenecks?: string | null
  offer_level1?: string | null
  offer_level2?: string | null
  offer_level3?: string | null
  recommended_entry?: string | null
  hiring_signal?: string | null
  approach_notes?: string | null
}

export interface MapResult {
  ok: boolean
  reason?: string
  dedup_key?: string | null
  row?: Record<string, unknown>
  /** Lead-only Zusatzfelder — werden erst am erzeugten Lead gesetzt, nicht in radar_targets. */
  rich?: Record<string, unknown>
}

const VALID_PRODUCT_AREAS = new Set(['Website', 'Social Media', 'KI-Integration'])
const VALID_OVERALL = new Set(['A', 'B', 'C', 'No-Fit'])
const VALID_PRIORITY = new Set(['low', 'medium', 'high'])
const VALID_REACHABILITY = new Set(['direkt', 'zentrale', 'unbekannt'])

function str(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s || null
}

function clamp(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  if (!Number.isFinite(n)) return null
  return Math.min(max, Math.max(min, n))
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => str(x)).filter((x): x is string => !!x)
}

/** Mappt einen Ingest-Lead auf eine radar_targets-Zeile.
 *  Pflicht: company_name + berechenbarer dedup_key — sonst ok:false. */
export function mapIngestToRadarTarget(lead: IngestLead | null | undefined): MapResult {
  if (!lead || typeof lead !== 'object') return { ok: false, reason: 'invalid_lead' }

  const company = str(lead.company_name)
  if (!company) return { ok: false, reason: 'company_name fehlt' }

  const website = str(lead.website)
  const phone = str(lead.phone)
  // Autoritativ: Domain vor Telefon; mitgelieferter Key nur als letzter Fallback.
  const dedupKey = computeDedupKey({ website, phone, fallback: str(lead.dedup_key) })
  if (!dedupKey) return { ok: false, reason: 'no_dedup_key (website oder phone nötig)' }

  const s = lead.scores || {}
  const overallRaw = str(s.overall)
  const priorityRaw = (str(s.priority) || '').toLowerCase() || null
  const dm = lead.decision_maker || {}
  const reachabilityRaw = (str(dm.reachability) || '').toLowerCase() || null

  const productAreas = strArray(lead.product_areas).filter((a) => VALID_PRODUCT_AREAS.has(a))

  const row: Record<string, unknown> = {
    dedup_key: dedupKey,
    company_name: company,
    industry: str(lead.industry),
    city: str(lead.city),
    website,
    social_url: str(lead.social_url),
    google_maps_url: str(lead.google_maps_url),
    phone,
    email: str(lead.email),
    address: str(lead.address),
    decision_maker_name: str(dm.name),
    decision_maker_role: str(dm.role),
    decision_maker_reachability:
      reachabilityRaw && VALID_REACHABILITY.has(reachabilityRaw) ? reachabilityRaw : 'unbekannt',
    website_score: clamp(s.website, 1, 10),
    social_score: clamp(s.social, 1, 10),
    ai_score: clamp(s.ai, 1, 10),
    soul_fit_score: clamp(s.soul_fit, 1, 10),
    lead_score_num: clamp(s.lead_score, 0, 100),
    overall_score: overallRaw && VALID_OVERALL.has(overallRaw) ? overallRaw : null,
    priority: priorityRaw && VALID_PRIORITY.has(priorityRaw) ? priorityRaw : null,
    confidence: clamp(s.confidence, 0, 1),
    product_areas: productAreas,
    recommended_offer: str(lead.recommended_offer),
    recommended_module_keys: strArray(lead.recommended_module_keys),
    pain_summary: str(lead.pain_summary),
    detected_weakness: str(lead.detected_weakness),
    opener_pitch: str(lead.opener_pitch),
    setter_context: str(lead.setter_context),
    closer_context: str(lead.closer_context),
    sources: strArray(lead.sources),
    status: 'scored',
    scan_source: 'ingest',
    scanned_at: str(lead.scanned_at) || new Date().toISOString(),
  }

  const csNum = clamp(lead.cross_sell_score, 0, 6)
  const rich: Record<string, unknown> = {
    linkedin: str(lead.linkedin),
    cluster: str(lead.cluster),
    employee_count: str(lead.employee_count),
    management: str(lead.management),
    owner_led: str(lead.owner_led),
    package_potential: str(lead.package_potential),
    cross_sell_score: csNum == null ? null : Math.round(csNum),
    key_bottlenecks: str(lead.key_bottlenecks),
    offer_level1: str(lead.offer_level1),
    offer_level2: str(lead.offer_level2),
    offer_level3: str(lead.offer_level3),
    recommended_entry: str(lead.recommended_entry),
    hiring_signal: str(lead.hiring_signal),
    approach_notes: str(lead.approach_notes),
  }
  // nur gesetzte Felder behalten
  for (const k of Object.keys(rich)) if (rich[k] == null) delete rich[k]

  return { ok: true, dedup_key: dedupKey, row, rich }
}
