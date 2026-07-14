// ============================================================
// Kanonische dedup_key-Normalisierung (Radar ↔ Sales-App)
// ------------------------------------------------------------
// Der dedup_key verhindert Doppel-Firmen über Radar UND Sales-App hinweg.
// BEIDE Seiten MÜSSEN exakt gleich normalisieren, sonst greift der Abgleich
// nicht. Die Sales-App ist autoritativ: der Ingest-Endpoint berechnet den Key
// IMMER selbst neu (aus website/phone) und ignoriert einen mitgelieferten Key,
// außer es ist weder Domain noch Telefon vorhanden.
//
// Regel (auch in RADAR_INGEST_API.md dokumentiert, damit das Radar identisch baut):
//   1. Wenn website vorhanden → dedup_key = normalisierte Domain (host, lowercase,
//      ohne Schema/Pfad, ohne führendes "www.").
//   2. Sonst wenn phone vorhanden → dedup_key = E.164-normalisierte Nummer.
//   3. Sonst → null (nicht dedupbar → Ingest lehnt den Lead ab).
// Domain hat Vorrang vor Telefon (stabiler).
// ============================================================

/** Normalisiert eine Website/Domain auf den nackten Host, z.B.
 *  "https://www.Foo-Bar.de/kontakt" → "foo-bar.de". Null wenn unbrauchbar. */
export function normalizeDomain(website: string | null | undefined): string | null {
  if (!website) return null
  const raw = String(website).trim()
  if (!raw) return null
  try {
    const withScheme = raw.includes('://') ? raw : `http://${raw}`
    let host = new URL(withScheme).hostname.toLowerCase()
    host = host.replace(/^www\./, '')
    // einfache Plausibilität: muss einen Punkt enthalten
    return host.includes('.') ? host : null
  } catch {
    return null
  }
}

/** Normalisiert eine Telefonnummer grob auf E.164. Default-Land DE (+49),
 *  da HK lokal (Gummersbach) akquiriert. "0 22 61 / 123-45" → "+49226112345". */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  let p = String(phone).replace(/[^\d+]/g, '')
  if (!p) return null
  if (p.startsWith('00')) p = `+${p.slice(2)}`
  if (!p.startsWith('+')) {
    if (p.startsWith('0')) p = `+49${p.slice(1)}` // DE-Default
    else p = `+${p}`
  }
  // E.164: + und 8–15 Ziffern
  const digits = p.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return null
  return p
}

/** Autoritativer dedup_key: Domain bevorzugt, sonst Telefon, sonst der
 *  mitgelieferte Fallback (getrimmt/lowercased), sonst null. */
export function computeDedupKey(input: {
  website?: string | null
  phone?: string | null
  fallback?: string | null
}): string | null {
  const domain = normalizeDomain(input.website)
  if (domain) return domain
  const phone = normalizePhone(input.phone)
  if (phone) return phone
  const fb = (input.fallback || '').trim().toLowerCase()
  return fb || null
}
