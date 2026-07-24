// ============================================================
// Entscheider-Parsing aus dem verifizierten "Geschäftsführung"-String
// der Leadliste. Ziel (Master-Prompt §3):
//   - Rollenwörter ("Geschäftsführer", "GF", "Vorstand", "Inhaber")
//     NIEMALS als Personen-/Vorname darstellen.
//   - Mehrere Personen einzeln trennen und darstellbar machen.
//   - Titel (Dr., Prof., Dipl.-Ing.) sauber vom Namen trennen.
//   - Klammer-Hinweise als Notiz behalten, nicht in den Namen mischen.
//   - Widersprüchliche/zu prüfende Angaben markieren.
//   - Kein Personenname → "noch nicht ermittelt".
// Reines Parsing (kein DB-Zugriff) — nutzbar in UI und Import.
// ============================================================

export interface ParsedPerson {
  fullName: string        // "Dr. Franz-Barthold Gockel"
  firstName: string | null
  lastName: string | null
  title: string | null    // "Dr.", "Prof. Dr.", "Dipl.-Ing." …
  note: string | null     // Klammer-Inhalt, z.B. "alleiniger GF"
}

export interface ParsedDecisionMakers {
  people: ParsedPerson[]
  hasConflict: boolean    // "WIDERSPRUCH", "prüfen", "unklar" im Rohtext
  raw: string | null
}

const TITLE_RE = /^(Prof\.?|Dr\.?|Dipl\.?-?\s?Ing\.?|Dipl\.?-?\s?Kfm\.?|Dipl\.?|Ing\.?|B\.?A\.?|M\.?A\.?|MBA|LL\.?M\.?)$/i

// Reine Rollen-/Funktionsbezeichnungen — nie ein Personenname.
const ROLE_ONLY = new Set([
  'geschäftsführer', 'geschäftsführerin', 'geschäftsführung', 'gf', 'gesellschafter',
  'geschäftsführender gesellschafter', 'geschäftsf. gesellschafter', 'managing partner',
  'vorstand', 'inhaber', 'inhaberin', 'ceo', 'coo', 'cto', 'partner', 'prokurist',
  'alleiniger gf', 'alleiniger geschäftsführer', 'namensgeber', 'gründer', 'gründerin',
  'familie', 'vorstand:', 'register',
])

const CONFLICT_RE = /(widerspruch|prüfen|pruefen|unklar|zu prüfen|register|impressum nennt|nicht best|widersprüchlich)/i

function stripRolePrefix(s: string): string {
  // "Vorstand: Dr. Armin Waibl" → "Dr. Armin Waibl"; "GF: X" → "X"
  return s.replace(/^\s*(vorstand|gf|geschäftsführung|geschäftsführer|register|impressum)\s*:\s*/i, '').trim()
}

/** Zerlegt ein Segment ("Dr. Franz-Barthold Gockel (alleiniger GF)") in eine Person.
 *  Gibt null zurück, wenn nur eine Rolle/kein echter Name übrig bleibt. */
function parsePerson(segment: string): ParsedPerson | null {
  let s = stripRolePrefix(segment.trim())
  if (!s) return null

  // Klammer-Hinweis abtrennen → Notiz
  let note: string | null = null
  const paren = s.match(/\(([^)]*)\)/)
  if (paren) {
    note = paren[1].trim() || null
    s = s.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
  }
  // führende Ordnungswörter/Konnektoren entfernen
  s = s.replace(/^(u\.?\s?a\.?|und|sowie|&|,)\s*/i, '').trim()
  if (!s) return null

  // reine Rolle? → keine Person
  if (ROLE_ONLY.has(s.toLowerCase())) return null

  const tokens = s.split(/\s+/).filter(Boolean)
  const titleParts: string[] = []
  let i = 0
  while (i < tokens.length && TITLE_RE.test(tokens[i])) { titleParts.push(tokens[i]); i++ }
  const nameTokens = tokens.slice(i)

  // Nach Titeln nichts mehr da, oder nur noch Rollenwort → keine Person
  const remainderLower = nameTokens.join(' ').toLowerCase()
  if (!nameTokens.length || ROLE_ONLY.has(remainderLower)) return null
  // einzelnes Rollen-Token ("Geschäftsführer") ohne echten Namen ausschließen
  if (nameTokens.length === 1 && ROLE_ONLY.has(nameTokens[0].toLowerCase())) return null

  const title = titleParts.length ? titleParts.join(' ') : null
  const firstName = nameTokens.length > 1 ? nameTokens[0] : null
  const lastName = nameTokens[nameTokens.length - 1] || null
  const fullName = [title, ...nameTokens].filter(Boolean).join(' ')

  return { fullName, firstName, lastName, title, note }
}

/** Parst den kompletten "Geschäftsführung"-Rohwert in strukturierte Entscheider. */
export function parseDecisionMakers(raw: string | null | undefined): ParsedDecisionMakers {
  const value = (raw || '').trim()
  if (!value || /^n\/?a$/i.test(value) || /^(unklar|unbekannt)/i.test(value)) {
    return { people: [], hasConflict: CONFLICT_RE.test(value), raw: value || null }
  }
  const hasConflict = CONFLICT_RE.test(value)

  // Personen-Segmente trennen: Zeilenumbruch, ";", "·", " und ", " & "
  // Komma ist heikel (Titel "Dr., Prof."), aber in dieser Liste trennt es Personen.
  const segments = value
    .split(/\n|;|·|\s+und\s+|\s*&\s*|,/i)
    .map(s => s.trim())
    .filter(Boolean)

  const people: ParsedPerson[] = []
  const seen = new Set<string>()
  for (const seg of segments) {
    const p = parsePerson(seg)
    if (!p) continue
    const key = p.fullName.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    people.push(p)
  }
  return { people, hasConflict, raw: value }
}

/** Kompakte Anzeige-Info für Header/Listen. */
export function decisionMakerSummary(raw: string | null | undefined): {
  label: string
  multiple: boolean
  conflict: boolean
  people: ParsedPerson[]
} {
  const parsed = parseDecisionMakers(raw)
  if (!parsed.people.length) {
    return { label: 'Ansprechpartner noch nicht ermittelt', multiple: false, conflict: parsed.hasConflict, people: [] }
  }
  if (parsed.people.length > 1) {
    return { label: 'Mehrere mögliche Entscheider – bitte auswählen', multiple: true, conflict: parsed.hasConflict, people: parsed.people }
  }
  return { label: parsed.people[0].fullName, multiple: false, conflict: parsed.hasConflict, people: parsed.people }
}
