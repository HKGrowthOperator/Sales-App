import crypto from 'crypto'

// ============================================================
// Einfache Mengenbegrenzung für teure Endpunkte.
// ------------------------------------------------------------
// Research und Enrichment rufen kostenpflichtige Dienste auf
// (Anthropic, Brave). Pro Anfrage sind sie gedeckelt — Research
// auf 25 Leads, Enrichment auf 30. Ungedeckelt war bisher die
// ANZAHL der Anfragen: ein Skript oder eine übernommene Sitzung
// hätte den Endpunkt in einer Schleife aufrufen können.
//
// Bewusst im Arbeitsspeicher gehalten: die App läuft in einem
// einzelnen Container, ein zusätzlicher Dienst wäre hier mehr
// Aufwand als Nutzen. Nach einem Neustart ist der Zähler leer —
// das ist vertretbar, weil es um Kostenschutz geht, nicht um
// Zugriffsschutz.
// ============================================================

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

// Aufräumen, damit die Map nicht unbegrenzt wächst.
function sweep(now: number) {
  if (buckets.size < 500) return
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * @param key      Eindeutig je Nutzer und Endpunkt, z. B. `upload:${userId}`
 * @param limit    Erlaubte Aufrufe im Zeitfenster
 * @param windowMs Länge des Zeitfensters
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)
  const b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }
  b.count++
  if (b.count > limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((b.resetAt - now) / 1000) }
  }
  return { allowed: true, remaining: limit - b.count, retryAfterSeconds: 0 }
}

/**
 * Zeitkonstanter Vergleich für geteilte Geheimnisse.
 *
 * Ein einfaches `a !== b` bricht beim ersten abweichenden Zeichen ab. Die
 * dadurch messbaren Laufzeitunterschiede erlauben es theoretisch, ein
 * Geheimnis Zeichen für Zeichen zu erraten. Der Aufwand hier ist minimal,
 * also gibt es keinen Grund, es nicht richtig zu machen.
 */
export function secretEquals(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false
  const ba = Buffer.from(a), bb = Buffer.from(b)
  if (ba.length !== bb.length) {
    // Trotzdem vergleichen, damit die Laufzeit nicht von der Länge abhängt.
    crypto.timingSafeEqual(ba, ba)
    return false
  }
  return crypto.timingSafeEqual(ba, bb)
}
