// ============================================================
// FREE-Enrichment — Website-Fetch + Domain-Discovery ohne API-Keys.
// Best-effort: Timeouts, try/catch, darf den Ingest NIE brechen.
// ------------------------------------------------------------
// enrichFromWebsite(url)  → Website-Qualität (1–10), gefundene
//                           Kontakte/Socials, Schwächen-Liste (DE).
// enrichBatch(...)        → dasselbe für viele Items, begrenzt parallel.
// discoverWebsite(name)   → rät Domain-Kandidaten aus dem Firmennamen
//                           und prüft, ob eine echte Seite antwortet.
// ============================================================

export interface WebsiteEnrichment {
  website_score: number
  notes: string
  found_phone: string | null
  found_email: string | null
  found_instagram: string | null
  found_facebook: string | null
  found_linkedin: string | null
  weaknesses: string[]
}

const UA =
  'Mozilla/5.0 (compatible; HK-LeadRadar/1.0; +https://hk-growthoperator.de)'

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    })
    return res
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

function ensureScheme(url: string): string {
  return url.includes('://') ? url : `https://${url}`
}

/** Analysiert eine Website heuristisch (kein LLM): Score 1–10 + Schwächen. */
export async function enrichFromWebsite(
  website: string,
  timeoutMs = 5000,
): Promise<WebsiteEnrichment | null> {
  const url = ensureScheme(website)
  const res = await fetchWithTimeout(url, timeoutMs)
  if (!res || !res.ok) return null
  let html = ''
  try {
    html = (await res.text()).slice(0, 400_000)
  } catch {
    return null
  }
  if (!html || html.length < 200) return null

  const lower = html.toLowerCase()
  const weaknesses: string[] = []
  let score = 5

  // HTTPS
  const isHttps = (res.url || url).startsWith('https://')
  if (isHttps) score += 1
  else { score -= 2; weaknesses.push('kein HTTPS') }

  // Mobile-Tauglichkeit
  const hasViewport = lower.includes('name="viewport"') || lower.includes("name='viewport'")
  if (hasViewport) score += 1
  else { score -= 1; weaknesses.push('nicht mobil-optimiert (kein Viewport)') }

  // Titel + Description (SEO-Basics)
  const titleMatch = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)
  if (!titleMatch || titleMatch[1].trim().length < 4) { score -= 1; weaknesses.push('kein/kaum Seitentitel (SEO)') }
  const hasDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i.test(html)
  if (hasDescription) score += 1
  else weaknesses.push('keine Meta-Description (SEO)')

  // Veraltete Technik
  if (/<frameset|<font\s|wordpress\/wp-content\/themes\/twentyten|jquery-1\.[0-9]/i.test(html)) {
    score -= 1
    weaknesses.push('veraltete Technik erkennbar')
  }

  // Inhaltsmenge (sehr dünne Seiten)
  const textOnly = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ')
  const words = textOnly.split(/\s+/).filter(Boolean).length
  if (words < 150) { score -= 1; weaknesses.push('sehr wenig Inhalt auf der Startseite') }
  else if (words > 500) score += 1

  // Impressum (Seriosität DE)
  const hasImpressum = /impressum/i.test(html)
  if (!hasImpressum) weaknesses.push('kein Impressum verlinkt')

  // Kontakte extrahieren
  const emailMatch = textOnly.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) ||
    html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  const phoneMatch = html.match(/tel:([+0-9][0-9\s\-/().]{6,20})/i) ||
    textOnly.match(/(?:tel\.?|telefon|fon)[:\s]*([+0][0-9\s\-/().]{6,20})/i)

  const instaMatch = html.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+/i)
  const fbMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9_.\-/]+/i)
  const liMatch = html.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_\-]+/i)
  if (!instaMatch && !fbMatch && !liMatch) weaknesses.push('keine Social-Media-Präsenz verlinkt')

  score = Math.min(10, Math.max(1, Math.round(score)))

  const notes = [
    `Heuristik-Check ${new URL(res.url || url).hostname}:`,
    `${words} Wörter`,
    isHttps ? 'HTTPS ok' : 'HTTP!',
    hasViewport ? 'mobil ok' : 'nicht mobil',
    hasImpressum ? 'Impressum ok' : 'Impressum fehlt',
  ].join(' · ')

  return {
    website_score: score,
    notes,
    found_phone: phoneMatch ? phoneMatch[1]?.trim() || null : null,
    found_email: emailMatch ? (emailMatch[1] || emailMatch[0]).trim() : null,
    found_instagram: instaMatch ? instaMatch[0] : null,
    found_facebook: fbMatch ? fbMatch[0] : null,
    found_linkedin: liMatch ? liMatch[0] : null,
    weaknesses,
  }
}

/** Begrenzte Parallel-Verarbeitung: pro Item URL holen, analysieren, apply().
 *  Fehler pro Item werden geschluckt (best-effort). */
export async function enrichBatch<T>(
  items: T[],
  getUrl: (item: T) => string | null,
  apply: (item: T, e: WebsiteEnrichment | null) => void,
  opts: { concurrency?: number; timeoutMs?: number; max?: number } = {},
): Promise<number> {
  const { concurrency = 5, timeoutMs = 5000, max = 30 } = opts
  const todo = items.filter((i) => !!getUrl(i)).slice(0, max)
  let done = 0
  let idx = 0
  async function worker() {
    while (idx < todo.length) {
      const item = todo[idx++]
      try {
        const url = getUrl(item)
        if (!url) continue
        const e = await enrichFromWebsite(url, timeoutMs)
        apply(item, e)
        if (e) done++
      } catch { /* best-effort */ }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, todo.length) }, worker))
  return done
}

// ── Domain-Discovery (free, ohne Such-API) ──────────────────────────────────
// Rät plausible Domains aus dem Firmennamen (Slug-Varianten × TLDs) und
// prüft per GET, ob eine echte Firmenseite antwortet (Domain-Parking wird
// grob aussortiert). Konservativ: lieber null als eine falsche Domain.

const LEGAL_SUFFIX =
  /\b(gmbh & co\.? kg|gmbh|ug \(haftungsbeschränkt\)|ug|ag|kg|ohg|gbr|e\.k\.|ek|inh\..*)$/i

function slugVariants(companyName: string): string[] {
  let base = companyName.toLowerCase().trim()
  base = base.replace(LEGAL_SUFFIX, '').trim()
  base = base
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/&/g, 'und')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!base || base.length < 3) return []
  const words = base.split(' ').filter(Boolean)
  const joined = words.join('')
  const dashed = words.join('-')
  const variants = new Set<string>([joined, dashed])
  if (words.length > 2) {
    variants.add(words.slice(0, 2).join('-'))
    variants.add(words.slice(0, 2).join(''))
  }
  return Array.from(variants).filter((v) => v.length >= 4 && v.length <= 40)
}

const PARKING_MARKERS = [
  'domain is for sale', 'domain kaufen', 'sedo', 'parkingcrew', 'this domain',
  'godaddy', 'united-domains', 'domain-parking', 'buy this domain',
]

async function looksLikeRealSite(url: string, timeoutMs: number): Promise<boolean> {
  const res = await fetchWithTimeout(url, timeoutMs)
  if (!res || !res.ok) return false
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('html')) return false
  let html = ''
  try { html = (await res.text()).slice(0, 60_000) } catch { return false }
  if (html.length < 400) return false
  const lower = html.toLowerCase()
  if (PARKING_MARKERS.some((m) => lower.includes(m))) return false
  return true
}

/** Versucht, die Website einer Firma OHNE Such-API zu finden (Domain-Raten).
 *  Gibt die gefundene URL zurück oder null. */
export async function discoverWebsite(
  companyName: string,
  _city: string | null = null,
  timeoutMs = 4500,
): Promise<string | null> {
  const variants = slugVariants(companyName)
  if (!variants.length) return null
  const tlds = ['de', 'com']
  // maximal 6 Kandidaten testen (Zeitbudget)
  const candidates: string[] = []
  for (const v of variants) for (const tld of tlds) candidates.push(`https://${v}.${tld}`)
  for (const url of candidates.slice(0, 6)) {
    try {
      if (await looksLikeRealSite(url, timeoutMs)) return url
    } catch { /* weiter */ }
  }
  return null
}
