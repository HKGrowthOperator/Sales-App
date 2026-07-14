// ============================================================
// No-Fit-Filter — Ketten/Filialen, Behörden, Schulen, Vereine raus,
// BEVOR ein Lead in radar_targets/leads landet. Rein musterbasiert
// (kein LLM), bewusst konservativ: im Zweifel 'ok' durchlassen —
// der menschliche Review im Radar bleibt die letzte Instanz.
// ============================================================

export type FitKind = 'ok' | 'chain' | 'public' | 'school' | 'association'

export interface FitResult {
  kind: FitKind
  reason: string
}

// Bekannte Ketten/Filialisten (Auszug — bewusst nur eindeutige Namen).
const CHAIN_NAMES = [
  'mcdonald', 'burger king', 'subway', 'kfc', 'starbucks', 'dominos', "domino's",
  'rewe', 'edeka', 'aldi', 'lidl', 'netto', 'penny', 'kaufland', 'norma',
  'dm-drogerie', 'dm drogerie', 'rossmann', 'müller drogerie',
  'obi', 'bauhaus', 'hornbach', 'toom', 'hagebau',
  'mediamarkt', 'media markt', 'saturn', 'expert ', 'euronics',
  'deichmann', 'h&m', 'c&a', 'zara', 'primark', 'tk maxx', 'takko', 'kik', 'ernsting',
  'apollo optik', 'fielmann', 'mister spex',
  'vodafone', 'telekom shop', 'o2 shop', '1&1 shop',
  'sparkasse', 'volksbank', 'commerzbank', 'deutsche bank', 'postbank', 'targobank',
  'allianz', 'ergo ', 'huk-coburg', 'huk coburg', 'debeka', 'axa ',
  'shell', 'aral', 'esso', 'total ', 'jet tankstelle',
  'burgerme', 'pizza hut', 'nordsee', 'backwerk', 'kamps',
  'sixt', 'europcar', 'hertz',
  'atu ', 'a.t.u', 'pitstop', 'euromaster', 'vergölst',
  'apotheke easyapotheke', 'doc morris',
  'fressnapf', 'futterhaus',
  'mcfit', 'fitx', 'clever fit', 'fitness first', 'john reed',
]

// Muster für Behörden / öffentliche Einrichtungen
const PUBLIC_PATTERNS: RegExp[] = [
  /\b(stadtverwaltung|gemeindeverwaltung|kreisverwaltung|bezirksregierung)\b/i,
  /\b(bürgeramt|ordnungsamt|jugendamt|sozialamt|gesundheitsamt|finanzamt|jobcenter|arbeitsagentur)\b/i,
  /\b(agentur für arbeit|bundesagentur)\b/i,
  /\b(rathaus|landratsamt|amtsgericht|landgericht|oberlandesgericht|staatsanwaltschaft)\b/i,
  /\b(polizei|feuerwehr|thw|bundeswehr|zoll)\b/i,
  /\b(ministerium|landesamt|bundesamt|regierungspräsidium)\b/i,
  /\b(stadtwerke|abfallwirtschaft|entsorgungsbetrieb)\b/i,
  /^(stadt|gemeinde|kreis|landkreis|markt|samtgemeinde|verbandsgemeinde)\s+[A-ZÄÖÜ]/,
  /\b(ihk|hwk|handwerkskammer|industrie- und handelskammer)\b/i,
]

// Muster für Schulen / Bildungs- & Betreuungseinrichtungen
const SCHOOL_PATTERNS: RegExp[] = [
  /\b(grundschule|hauptschule|realschule|gesamtschule|gymnasium|berufskolleg|berufsschule|förderschule|sekundarschule|waldorfschule|montessori)\b/i,
  /\b(universität|hochschule|fachhochschule|volkshochschule|vhs)\b/i,
  /\b(kita|kindergarten|kindertagesstätte|kinderkrippe|hort)\b/i,
  /\bschule\b/i,
]

// Muster für Vereine / Non-Profit
const ASSOCIATION_PATTERNS: RegExp[] = [
  /\be\.\s?v\.?$/i,
  /\be\.\s?v\.?\b/i,
  /\b(verein|sportverein|förderverein|bürgerverein|heimatverein|schützenverein|musikverein|turnverein)\b/i,
  /\b(sv|tsv|tus|vfl|vfb|fc|sg|djk)\s+[A-ZÄÖÜ0-9]/,
  /\b(kirchengemeinde|pfarramt|pfarrei|bistum|diakonie|caritas|drk|rotes kreuz|malteser|johanniter|awo|arbeiterwohlfahrt)\b/i,
  /\b(stiftung|gemeinnützig|ggmbh)\b/i,
]

/** Klassifiziert einen Firmennamen: 'ok' = potentieller Kunde,
 *  sonst Ausschlussgrund (chain/public/school/association). */
export function classifyFit(companyName: string | null | undefined): FitResult {
  const name = (companyName || '').trim()
  if (!name) return { kind: 'ok', reason: '' }
  const lower = name.toLowerCase()

  for (const chain of CHAIN_NAMES) {
    if (lower.includes(chain.trim())) {
      return { kind: 'chain', reason: `bekannte Kette/Filialist (${chain.trim()})` }
    }
  }
  for (const re of PUBLIC_PATTERNS) {
    if (re.test(name)) return { kind: 'public', reason: 'Behörde/öffentliche Einrichtung' }
  }
  for (const re of SCHOOL_PATTERNS) {
    if (re.test(name)) return { kind: 'school', reason: 'Schule/Bildungseinrichtung' }
  }
  for (const re of ASSOCIATION_PATTERNS) {
    if (re.test(name)) return { kind: 'association', reason: 'Verein/Non-Profit' }
  }
  return { kind: 'ok', reason: '' }
}
