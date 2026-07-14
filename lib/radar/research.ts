// ============================================================
// Research-Schicht — verifizierte Lead-Einordnung VOR dem Insert.
// Aktiv nur mit BRAVE_API_KEY + ANTHROPIC_API_KEY; sonst ist
// researchEnabled() false und der Ingest nutzt den free Pfad
// (lib/radar/enrich.ts). Best-effort: bricht den Ingest NIE.
// ------------------------------------------------------------
// Ablauf pro Firma: Brave-Websuche → Top-Treffer-Seite lesen →
// LLM verifiziert Fakten (Website ja/nein + Qualität, Kette?,
// Entscheider, Kontakt, Pain, Pitch, Produkt-Empfehlung, Score).
// ============================================================

export interface ResearchInput {
  company_name: string
  city: string | null
  industry: string | null
  website: string | null
  phone: string | null
}

export interface ResearchResult {
  is_chain?: boolean
  chain_reason?: string | null
  has_website?: boolean | null
  website_url?: string | null
  website_quality?: number | null // 1–10
  decision_maker_name?: string | null
  decision_maker_role?: string | null
  phone?: string | null
  email?: string | null
  social_url?: string | null
  pain_summary?: string | null
  opener_pitch?: string | null
  product_areas?: string[] | null // 'Website' | 'Social Media' | 'KI-Integration'
  recommended_offer?: string | null
  overall?: string | null // A | B | C | No-Fit
  confidence?: number | null // 0–1
  notes?: string | null
}

export function researchEnabled(): boolean {
  return !!(process.env.BRAVE_API_KEY && process.env.ANTHROPIC_API_KEY)
}

async function braveSearch(query: string): Promise<Array<{ title: string; url: string; description: string }>> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&country=de&search_lang=de`,
    { headers: { 'X-Subscription-Token': process.env.BRAVE_API_KEY!, accept: 'application/json' } },
  )
  if (!res.ok) return []
  const data = await res.json().catch(() => null)
  const results = data?.web?.results || []
  return results.map((r: any) => ({
    title: String(r.title || ''),
    url: String(r.url || ''),
    description: String(r.description || ''),
  }))
}

async function fetchPageText(url: string, timeoutMs = 6000): Promise<string> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; HK-LeadRadar/1.0)' },
    })
    if (!res.ok) return ''
    const html = (await res.text()).slice(0, 300_000)
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 8000)
  } catch {
    return ''
  } finally {
    clearTimeout(t)
  }
}

async function askClaude(input: ResearchInput, searchResults: string, pageText: string): Promise<ResearchResult | null> {
  const prompt = `Du bist der Research-Agent des HK Lead Radars (B2B-Akquise einer Digital-Agentur in Gummersbach, NRW).
Verifiziere die folgende Firma anhand der Suchtreffer und des Seiteninhalts. Antworte NUR mit einem JSON-Objekt.

FIRMA: ${input.company_name}${input.city ? ` · ${input.city}` : ''}${input.industry ? ` · Branche: ${input.industry}` : ''}${input.website ? ` · bekannte Website: ${input.website}` : ' · keine Website bekannt'}${input.phone ? ` · Telefon: ${input.phone}` : ''}

SUCHTREFFER:
${searchResults || '(keine)'}

SEITENINHALT (Auszug):
${pageText || '(keiner)'}

JSON-Felder (alle optional, null wenn unbekannt):
{
  "is_chain": bool — Kette/Filialist/Behörde/Verein (No-Fit für lokale Agentur-Akquise)?,
  "chain_reason": string|null,
  "has_website": bool|null — hat die Firma eine echte eigene Website?,
  "website_url": string|null — die verifizierte URL,
  "website_quality": 1-10|null — Qualität der Website,
  "decision_maker_name": string|null — Inhaber/GF laut Impressum/Suche,
  "decision_maker_role": string|null,
  "phone": string|null, "email": string|null, "social_url": string|null,
  "pain_summary": string|null — größter erkennbarer Engpass (1-2 Sätze, deutsch),
  "opener_pitch": string|null — 1 Satz Gesprächseinstieg für den Opener (deutsch),
  "product_areas": Array aus "Website"|"Social Media"|"KI-Integration",
  "recommended_offer": string|null,
  "overall": "A"|"B"|"C"|"No-Fit",
  "confidence": 0.0-1.0,
  "notes": string|null — kurze Begründung
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => null)
  const text: string = data?.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0]) as ResearchResult
  } catch {
    return null
  }
}

/** Recherchiert ein einzelnes Unternehmen (Suche → Seite → LLM). */
export async function researchCompany(input: ResearchInput): Promise<ResearchResult | null> {
  if (!researchEnabled()) return null
  try {
    const q = `"${input.company_name}"${input.city ? ` ${input.city}` : ''} Impressum`
    const hits = await braveSearch(q)
    const summary = hits.map((h, i) => `${i + 1}. ${h.title} — ${h.url}\n   ${h.description}`).join('\n')
    // beste Seite lesen: bekannte Website bevorzugt, sonst erster Suchtreffer
    const pageUrl = input.website || hits[0]?.url || null
    const pageText = pageUrl ? await fetchPageText(pageUrl.includes('://') ? pageUrl : `https://${pageUrl}`) : ''
    return await askClaude(input, summary, pageText)
  } catch {
    return null
  }
}

/** Begrenzte Parallel-Recherche über viele Items; gibt Anzahl erfolgreicher
 *  Recherchen zurück. Fehler pro Item werden geschluckt (best-effort). */
export async function researchBatch<T>(
  items: T[],
  getInput: (item: T) => ResearchInput,
  apply: (item: T, r: ResearchResult | null) => void,
  opts: { concurrency?: number; max?: number } = {},
): Promise<number> {
  const { concurrency = 3, max = 25 } = opts
  if (!researchEnabled()) return 0
  const todo = items.slice(0, max)
  let done = 0
  let idx = 0
  async function worker() {
    while (idx < todo.length) {
      const item = todo[idx++]
      try {
        const r = await researchCompany(getInput(item))
        apply(item, r)
        if (r) done++
      } catch { /* best-effort */ }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, todo.length) }, worker))
  return done
}
