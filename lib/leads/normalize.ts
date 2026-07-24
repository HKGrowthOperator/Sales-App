// ============================================================
// Normalisierung von Rohtext-Feldern der Leadliste in Filter-/
// UI-taugliche Struktur (Master-Prompt §3/§4). Originalwerte
// bleiben immer erhalten; hier entsteht nur die Zusatzstruktur.
// ============================================================

/** "ca. 90" → {min:90,max:90}; "20–50" → {20,50}; "~40" → {40,40};
 *  "über 100" → {100,null}; "<15" → {null,15}; "85+" → {85,null}. */
export function parseEmployeeCount(raw: string | null | undefined): { min: number | null; max: number | null } {
  const s = (raw || '').toString().trim()
  if (!s) return { min: null, max: null }

  // Bereich "20-50" / "20–50" / "11 bis 50"
  const range = s.match(/(\d[\d.]*)\s*(?:[-–—]|bis)\s*(\d[\d.]*)/)
  if (range) {
    const a = toInt(range[1]); const b = toInt(range[2])
    return { min: a, max: b }
  }
  const num = s.match(/(\d[\d.]*)/)
  if (!num) return { min: null, max: null }
  const n = toInt(num[1])
  if (n == null) return { min: null, max: null }

  if (/(über|ueber|mehr als|>|\+|ab)\s*/i.test(s) && !/</.test(s)) return { min: n, max: null }
  if (/(unter|weniger als|<|bis zu|max)/i.test(s)) return { min: null, max: n }
  // "ca." / "~" / "etwa" → Punktschätzung
  return { min: n, max: n }
}

function toInt(v: string): number | null {
  const n = parseInt(v.replace(/[.\s]/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

/** Formatiert einen optionalen Umsatz für die Anzeige — "Nicht bekannt" wenn leer. */
export function formatRevenue(lead: {
  revenue_amount?: number | null
  revenue_currency?: string | null
  revenue_period?: string | null
  revenue_is_estimate?: boolean | null
}): string {
  if (lead.revenue_amount == null) return 'Nicht bekannt'
  const cur = lead.revenue_currency || 'EUR'
  const amount = new Intl.NumberFormat('de-DE').format(lead.revenue_amount)
  const period = lead.revenue_period === 'monat' ? '/Monat' : lead.revenue_period === 'jahr' ? '/Jahr' : ''
  const est = lead.revenue_is_estimate ? ' (geschätzt)' : ''
  return `${amount} ${cur}${period}${est}`
}
