// ============================================================
// Lead-Contract — festes Ausgabeformat des Radars für ein
// externes Empfänger-System. Typen: lib/radar/leadContract.d.ts.
// ============================================================

/** Ab diesem Lead-Score (0–100) gilt ein Lead als qualifiziert. */
export const QUALIFY_MIN_SCORE = 60

function s(v) {
  if (v == null) return ''
  return String(v).trim()
}

function num(v, fallback = 0) {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : fallback
}

function domainFrom(website) {
  const raw = s(website)
  if (!raw) return ''
  try {
    const withScheme = raw.includes('://') ? raw : `http://${raw}`
    return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Baut aus einem Roh-Lead (Ingest-Format) den festen Lead-Contract. */
export function toLeadContract(rawLead, options = {}) {
  const lead = rawLead || {}
  const dm = lead.decision_maker || {}
  const scores = lead.scores || {}

  const matched = []
  if (s(lead.website)) matched.push('website_vorhanden')
  if (s(lead.phone)) matched.push('telefon_vorhanden')
  if (s(lead.email)) matched.push('email_vorhanden')
  if (s(dm.name)) matched.push('entscheider_bekannt')
  if (s(lead.pain_summary) || s(lead.detected_weakness)) matched.push('pain_erkannt')
  if (Array.isArray(lead.product_areas) && lead.product_areas.length) matched.push('produktfeld_zugeordnet')

  const contract = {
    lead_id: options.lead_id || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `lead-${Math.abs(hashCode(JSON.stringify(lead)))}`),
    timestamp: options.timestamp || new Date().toISOString(),
    source: options.source || 'hk-lead-radar',
    status: 'neu',
    company: {
      name: s(lead.company_name),
      domain: domainFrom(lead.website),
      branche: s(lead.industry),
      groesse: s(lead.company_size),
      ort: s(lead.city),
    },
    kontakt: {
      name: s(dm.name),
      rolle: s(dm.role),
      email: s(lead.email),
      telefon: s(lead.phone),
    },
    signale: {
      trigger: s(lead.pain_summary) || s(lead.detected_weakness) || s(lead.opener_pitch),
      score: Math.max(0, Math.min(100, num(scores.lead_score, 0))),
      matched_kriterien: matched,
    },
    meta: {
      notiz: s(lead.recommended_offer),
      raw: options.includeRaw === false ? {} : { ...lead },
    },
  }
  if (contract.signale.score >= QUALIFY_MIN_SCORE) contract.status = 'qualifiziert'
  return contract
}

function hashCode(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0 }
  return h
}

/** Qualifiziert = Firmenname + Kontaktweg + Score über Schwelle. */
export function isLeadQualified(contract) {
  if (!contract || !contract.company?.name) return false
  const hasContactChannel = !!(contract.kontakt?.email || contract.kontakt?.telefon || contract.company?.domain)
  return hasContactChannel && num(contract.signale?.score, 0) >= QUALIFY_MIN_SCORE
}
