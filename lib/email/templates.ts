// ============================================================
// HK-Mail-Vorlagen — Auswahl, Variablen und Rendering für die
// automatischen Terminbestätigungen (Setter = Experten-Call,
// Closer = Strategiegespräch), je Produktfeld.
// ------------------------------------------------------------
// Die eingebauten Texte stammen 1:1 aus dem HK Mailsystem
// (Google Drive, Stand 13.07.2026):
//   HK-SALES-EXPERT-CALL-BOOKED-{WEBSITE/SOCIAL/AI/SYSTEM}-V1
//   HK-SALES-CLOSER-BOOKED-{WEBSITE/SOCIAL/AI/SYSTEM}-V1
// selectTemplate() schaut zuerst in die DB-Tabelle
// email_templates (falls gepflegt) und fällt sonst auf diese
// eingebauten Vorlagen zurück.
// ============================================================
import { renderHkEmailHtml } from '@/lib/email/layout'

export type CallType = 'setter_call' | 'closer_call'
// DB-kompatible Werte (CHECK-Constraints aus 013/014):
// website_funnel · social_media_brand_building · ai_integration · growth_system
export type ProductArea = 'website_funnel' | 'social_media_brand_building' | 'ai_integration' | 'growth_system'

export const PRODUCT_LABEL: Record<ProductArea, string> = {
  website_funnel: 'Websites',
  social_media_brand_building: 'Social Media & Branding',
  ai_integration: 'KI-Integration',
  growth_system: 'Ganzheitliches Wachstumssystem',
}

/** Einstiegswinkel des Leads → Produktfeld (Pfeiler). Deckt alle 15 Winkel ab:
 *  Lokale Sichtbarkeit → Website · PB/UB/Content/Imagefilm/Events → Branding ·
 *  KI/Automationen → KI · Komplettangebot/Anfragen/Ads/Recruiting/Rest → Wachstumssystem. */
export function productAreaFromEntryAngle(entryAngle: string | null | undefined): ProductArea {
  switch (entryAngle) {
    case 'Website':
    case 'Lokale Sichtbarkeit':
      return 'website_funnel'
    case 'Social Media':
    case 'Personal Brand':
    case 'Unternehmensbrand':
    case 'Außenwirkung':
    case 'Content-Produktion':
    case 'Imagefilm':
    case 'Events':
      return 'social_media_brand_building'
    case 'KI-Zeitersparnis':
    case 'Automationen & CRM':
      return 'ai_integration'
    default:
      return 'growth_system'
  }
}

export interface EmailTemplate {
  id: string | null
  key: string
  subject: string
  body_text: string
  body_html?: string | null
}

export type TemplateVars = Record<string, string | null>

// ── Meeting-Link ─────────────────────────────────────────────────────────────
// Fester Team-/Rollen-Link aus der Tabelle meeting_links (role_type +
// optional product_area), sonst der übergebene persönliche Fallback-Link.
export async function resolveMeetingLink(
  supabase: any,
  p: { roleType: 'setter' | 'closer'; productArea: ProductArea; fallback?: string | null },
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('meeting_links')
      .select('url, product_area, role_type, is_active')
      .eq('role_type', p.roleType)
      .eq('is_active', true)
    const rows = (data || []) as Array<{ url: string; product_area: string | null }>
    const exact = rows.find((r) => r.product_area === p.productArea)
    if (exact?.url) return exact.url
    const generic = rows.find((r) => !r.product_area)
    if (generic?.url) return generic.url
  } catch {
    /* Tabelle fehlt/leer → Fallback */
  }
  return p.fallback || null
}

// ── Variablen ────────────────────────────────────────────────────────────────
export function buildTemplateVars(p: {
  lead: any
  startAt: string
  timeZone?: string
  productArea: ProductArea
  expertName?: string | null
  setterName?: string | null
  closerName?: string | null
  zoomLink?: string | null
  openerName?: string | null
  rescheduleLink?: string | null
  paymentLink?: string | null
  recommendedOffer?: string | null
  durationMinutes?: number | null
}): TemplateVars {
  const tz = p.timeZone || 'Europe/Berlin'
  const start = new Date(p.startAt)
  const dateFmt = new Intl.DateTimeFormat('de-DE', { timeZone: tz, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const timeFmt = new Intl.DateTimeFormat('de-DE', { timeZone: tz, hour: '2-digit', minute: '2-digit' })

  const contactName: string = p.lead?.contact_name || ''
  const firstName = contactName.trim().split(/\s+/)[0] || contactName || ''
  const duration = p.durationMinutes || null

  return {
    // Kern-Variablen (App-intern)
    first_name: firstName || null,
    contact_name: contactName || null,
    company_name: p.lead?.company_name || null,
    appointment_date: dateFmt.format(start),
    appointment_time: timeFmt.format(start),
    expert_name: p.expertName || null,
    setter_name: p.setterName || null,
    closer_name: p.closerName || null,
    zoom_link: p.zoomLink || null,
    product_area: p.productArea,
    product_label: PRODUCT_LABEL[p.productArea],
    recommended_offer: p.recommendedOffer || null,
    payment_link: p.paymentLink || null,
    // Aliase im Namensschema des HK-Mailsystems ({{…}} in den Vorlagen)
    contact_first_name: firstName || null,
    assigned_opener_name: p.openerName || null,
    assigned_setter_name: p.setterName || p.expertName || null,
    assigned_closer_name: p.closerName || p.expertName || null,
    appointment_link: p.zoomLink || null,
    appointment_duration: duration ? `${duration} Minuten` : null,
    reschedule_link: p.rescheduleLink || null,
  }
}

// ── Rendering ────────────────────────────────────────────────────────────────
/** Ersetzt {{variable}}-Platzhalter; unbekannte/leere Variablen werden
 *  entfernt (inkl. überflüssiger Leerzeilen). */
export function renderTemplateString(template: string, vars: TemplateVars): string {
  return template
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => vars[key] ?? '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function renderEmailFull(
  tpl: EmailTemplate,
  vars: TemplateVars,
  callType: CallType,
): { subject: string; text: string; html: string } {
  const subject = renderTemplateString(tpl.subject, vars)
  const text = renderTemplateString(tpl.body_text, vars)
  const html = tpl.body_html
    ? renderTemplateString(tpl.body_html, vars)
    : renderHkEmailHtml({ bodyText: text, subject, vars, callType })
  return { subject, text, html }
}

// ── Vorlagen-Auswahl ─────────────────────────────────────────────────────────
/** Wählt die Vorlage: 1) DB email_templates (key + product_area, aktiv),
 *  2) DB key generisch, 3) eingebaute HK-Vorlage. Nie null bei bekannten Keys. */
export async function selectTemplate(
  supabase: any,
  p: { templateKey: string; callType: CallType; productArea: ProductArea },
): Promise<EmailTemplate | null> {
  try {
    const { data } = await supabase
      .from('email_templates')
      .select('id, key, product_area, subject, body_text, body_html, is_active')
      .eq('key', p.templateKey)
      .eq('is_active', true)
    const rows = (data || []) as Array<any>
    const exact = rows.find((r) => r.product_area === p.productArea)
    const generic = rows.find((r) => !r.product_area)
    const hit = exact || generic
    if (hit?.subject && hit?.body_text) {
      return { id: hit.id, key: hit.key, subject: hit.subject, body_text: hit.body_text, body_html: hit.body_html || null }
    }
  } catch {
    /* Tabelle fehlt → eingebaute Vorlagen */
  }
  return builtinTemplate(p.templateKey, p.productArea)
}

// ── Eingebaute HK-Vorlagen (Originaltexte aus dem HK Mailsystem) ─────────────

const SETTER_INTRO = 'Hallo {{contact_first_name}},\n\nvielen Dank für das Gespräch mit {{assigned_opener_name}}.'
const SETTER_DETAILS =
  '{{appointment_date}} um {{appointment_time}} Uhr\nDauer: ca. {{appointment_duration}}\nZugang: {{appointment_link}}'
const SETTER_OUTRO = 'Beste Grüße\n\n{{assigned_setter_name}}\nHK Growth Operator'
const CLOSER_INTRO =
  'Hallo {{contact_first_name}},\n\nvielen Dank für den Experten-Call mit {{assigned_setter_name}}.\n\nAuf Grundlage Ihrer Ausgangssituation und der besprochenen Ziele sehen wir einen sinnvollen Ansatz, den wir im nächsten Termin konkret ausarbeiten.\n\nIhr Strategiegespräch mit {{assigned_closer_name}} findet statt am:'
const CLOSER_MIDDLE =
  'Im Gespräch betrachten wir außerdem den sinnvollen Leistungsumfang, Verantwortlichkeiten, Voraussetzungen, wirtschaftliche Rahmenbedingungen und die Entscheidung über das weitere Vorgehen.\n\nDamit alle fachlichen und wirtschaftlichen Fragen direkt geklärt werden können, sollten alle Personen teilnehmen, die an der Entscheidung oder späteren Umsetzung beteiligt sind.'
const CLOSER_OUTRO = 'Beste Grüße\n\n{{assigned_closer_name}}\nHK Growth Operator'

const SETTER_BODY: Record<ProductArea, string> = {
  website_funnel: `${SETTER_INTRO}

Ihr kostenfreier Website-Experten-Call mit {{assigned_setter_name}} ist verbindlich eingetragen:

${SETTER_DETAILS}

Im Call analysieren wir Ihre Website aus strategischer, gestalterischer und vertrieblicher Sicht. Entscheidend ist nicht nur, wie die Seite aussieht, sondern ob Besucher schnell verstehen, warum sie gerade Ihr Unternehmen wählen sollten und ob der Weg zur Anfrage konsequent aufgebaut ist.

Sie erhalten konkretes Expertenfeedback zu Positionierung, Nutzerführung, Vertrauensaufbau, Angebotsdarstellung und Conversion. Wir zeigen Ihnen klar, welche Elemente bereits tragen, wo Potenzial verloren geht und welche nächsten Schritte fachlich den größten Hebel besitzen.

Hilfreich sind der Link zu Ihrer aktuellen Website, Ihre wichtigsten Leistungen und eine kurze Einordnung Ihres derzeitigen Anfragewegs.

Erst nach der fachlichen Einschätzung prüfen wir gemeinsam, ob ein weiterer strategischer Austausch oder eine Zusammenarbeit sinnvoll ist.

${SETTER_OUTRO}`,
  social_media_brand_building: `${SETTER_INTRO}

Ihr kostenfreier Social-Media-Experten-Call mit {{assigned_setter_name}} ist verbindlich eingetragen:

${SETTER_DETAILS}

Im Call analysieren wir, wie Ihre Social-Media-Präsenz mit Ihrer Positionierung, Ihren Angeboten und Ihrer Kundengewinnung zusammenspielt.

Wir betrachten nicht nur einzelne Posts oder Reichweitenzahlen. Entscheidend ist, ob Ihre Inhalte die richtigen Menschen erreichen, Vertrauen aufbauen, Ihr Angebot verständlich machen und Interessenten konsequent in den nächsten Schritt führen.

Sie erhalten konkretes Expertenfeedback zu Ihrer Außenwirkung, Content-Logik, Wiedererkennbarkeit, Distribution und dem Übergang von Aufmerksamkeit zu qualifizierten Anfragen.

Hilfreich sind Ihre aktuellen Profile, Ihre wichtigsten Angebote, Ihre Zielgruppe und eine kurze Einordnung der bisherigen Ergebnisse.

Erst nach unserer fachlichen Einschätzung prüfen wir gemeinsam, ob ein weiterer Austausch oder eine Zusammenarbeit sinnvoll ist.

${SETTER_OUTRO}`,
  ai_integration: `${SETTER_INTRO}

Ihr kostenfreier KI-Experten-Call mit {{assigned_setter_name}} ist verbindlich eingetragen:

${SETTER_DETAILS}

Im Call geht es nicht um allgemeine KI-Trends, sondern um konkrete Abläufe in Ihrem Unternehmen.

Wir analysieren, welche Aufgaben unnötig manuell laufen, wo Informationen mehrfach erfasst oder bei Übergaben verloren werden und welche Prozesse sich realistisch automatisieren oder durch KI verbessern lassen.

Sie erhalten eine fachliche Einschätzung dazu, welche Anwendungsfelder wirtschaftlich sinnvoll sind, welche Voraussetzungen benötigt werden und welche Ideen aktuell keinen belastbaren Nutzen schaffen würden.

Hilfreich sind eine kurze Übersicht Ihrer eingesetzten Systeme, wiederkehrender Aufgaben und der größten internen Zeitfresser.

Erst anschließend prüfen wir gemeinsam, ob eine vertiefte Analyse oder Zusammenarbeit sinnvoll ist.

${SETTER_OUTRO}`,
  growth_system: `${SETTER_INTRO}

Ihr kostenfreier strategischer Experten-Call mit {{assigned_setter_name}} ist verbindlich eingetragen:

${SETTER_DETAILS}

Im Call betrachten wir nicht nur eine einzelne Maßnahme. Wir analysieren, wie Positionierung, Social Media, Website, Anfragewege, Vertrieb, Follow-up und Automatisierung in Ihrem Unternehmen aktuell zusammenspielen.

Sie erhalten konkretes Expertenfeedback dazu, an welchen Übergängen Potenzial verloren geht, welcher Engpass derzeit den größten Einfluss auf Wachstum besitzt und welche Reihenfolge der nächsten Schritte fachlich sinnvoll ist.

Der Fokus liegt nicht darauf, möglichst viele Einzelleistungen zu empfehlen. Entscheidend ist, ein System zu entwickeln, in dem Aufmerksamkeit, Vertrauen, Anfrage, Entscheidung und operative Bearbeitung sauber ineinandergreifen.

Hilfreich sind Ihre wichtigsten Angebote, Zielkunden, Website, Social-Media-Kanäle und eine grobe Übersicht Ihres aktuellen Vertriebsprozesses.

Erst nach unserer Einordnung prüfen wir gemeinsam, ob und in welcher Form eine Zusammenarbeit sinnvoll ist.

${SETTER_OUTRO}`,
}

const CLOSER_FOCUS: Record<ProductArea, string> = {
  website_funnel:
    'Im nächsten Termin konkretisieren wir, wie Positionierung, Seitenstruktur, Vertrauensaufbau, Conversion und technischer Aufbau zu einem belastbaren digitalen Vertriebsweg verbunden werden.',
  social_media_brand_building:
    'Im nächsten Termin konkretisieren wir, wie Positionierung, Content, Distribution und der Übergang zur Anfrage als planbares Social-Media-System aufgebaut werden.',
  ai_integration:
    'Im nächsten Termin konkretisieren wir den priorisierten Prozess, die technisch sinnvolle Lösung, notwendige Schnittstellen und den wirtschaftlichen Rahmen der Umsetzung.',
  growth_system:
    'Im nächsten Termin konkretisieren wir die sinnvolle Reihenfolge aus Positionierung, Social Media, Website, Sales, CRM und Automatisierung.',
}

const SETTER_SUBJECT: Record<ProductArea, string> = {
  website_funnel: 'Ihr kostenfreier Experten-Call zu Websites',
  social_media_brand_building: 'Ihr kostenfreier Experten-Call zu Social Media',
  ai_integration: 'Ihr kostenfreier Experten-Call zu KI-Integration',
  growth_system: 'Ihr kostenfreier Experten-Call zu Ganzheitliches Wachstumssystem',
}

const CLOSER_SUBJECT: Record<ProductArea, string> = {
  website_funnel: 'Ihr Strategiegespräch zu Websites',
  social_media_brand_building: 'Ihr Strategiegespräch zu Social Media',
  ai_integration: 'Ihr Strategiegespräch zu KI-Integration',
  growth_system: 'Ihr Strategiegespräch zu Ganzheitliches Wachstumssystem',
}

function builtinTemplate(templateKey: string, productArea: ProductArea): EmailTemplate | null {
  if (templateKey === 'setter_booking_confirmation') {
    return {
      id: null,
      key: templateKey,
      subject: SETTER_SUBJECT[productArea],
      body_text: SETTER_BODY[productArea],
    }
  }
  if (templateKey === 'closer_booking_confirmation') {
    return {
      id: null,
      key: templateKey,
      subject: CLOSER_SUBJECT[productArea],
      body_text: `${CLOSER_INTRO}

${SETTER_DETAILS}

${CLOSER_FOCUS[productArea]}

${CLOSER_MIDDLE}

${CLOSER_OUTRO}`,
    }
  }
  return null
}
