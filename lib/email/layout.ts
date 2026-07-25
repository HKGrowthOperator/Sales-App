// ============================================================
// HK-E-Mail-Layout — rendert Plain-Text-Mailinhalt in das
// HK-Growth-Operator-HTML-Design (dunkler Header, Termin-Box,
// Footer). E-Mail-sicher: Tabellen-Layout + Inline-Styles.
// ============================================================

export interface HkEmailLayoutArgs {
  bodyText: string
  subject: string
  vars?: Record<string, string | null | undefined>
  callType?: string
}

// HK-Markenfarben: dunkles Smaragd + Gold auf cremefarbenem Briefbogen.
// Bewusst OHNE Bilder gebaut — der Schriftzug entsteht aus Text, damit
// nichts blockiert wird, nichts nachgeladen werden muss und keine
// Anhänge entstehen. Die Mail ist die Mail.
const C = {
  emerald:   '#0E2E26',
  emeraldDk: '#0A211B',
  gold:      '#C9A063',
  goldLight: '#E7CF9F',
  goldSoft:  '#E3D6BC',
  paper:     '#FBF9F5',
  panel:     '#F4F0E8',
  ink:       '#14251F',
  body:      '#2A3A34',
  muted:     '#7C8A83',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Wandelt den Plain-Text-Inhalt in sauberes Mail-HTML um und erkennt dabei
 *  Struktur: VERSAL-Überschriften, Trennlinien, Aufzählungen (— / 1.) und die
 *  Termin-Zeilen ("Termin   …"), die bei vorhandener Termin-Box entfallen,
 *  damit nichts doppelt erscheint. */
function textToHtml(text: string, opts: { hasAppointmentBox?: boolean } = {}): string {
  const APPT_LINE = /^(Termin|Uhrzeit|Zugang|Dauer|Ihr Experte)\s{2,}\S/i
  const SEPARATOR = /^[─—–_-]{6,}$/
  const HEADING = /^[A-ZÄÖÜ][A-ZÄÖÜ0-9 .,&/()–-]{5,}$/   // z. B. "DIE KURZFASSUNG"
  const BULLET = /^—\s+/
  const NUMBERED = /^\d+\.\s+/

  const blocks = escapeHtml(text.trim()).split(/\n{2,}/)
  const out: string[] = []

  for (const raw of blocks) {
    const lines = raw.split('\n').map((l) => l.trimEnd())

    // Termin-Block überspringen, wenn die Box ihn schon zeigt
    if (opts.hasAppointmentBox && lines.every((l) => !l.trim() || APPT_LINE.test(l.trim()))) continue

    // Trennlinie
    if (lines.length === 1 && SEPARATOR.test(lines[0].trim())) {
      out.push(`<div style="border-top:1px solid ${C.goldSoft};margin:28px 0;font-size:0;line-height:0;">&nbsp;</div>`)
      continue
    }

    // Überschrift (einzeilig, VERSALIEN)
    if (lines.length === 1 && HEADING.test(lines[0].trim())) {
      out.push(
        `<p style="margin:30px 0 12px;font-size:11px;font-weight:700;letter-spacing:.16em;` +
        `text-transform:uppercase;color:${C.gold};font-family:Georgia,'Times New Roman',serif;">${lines[0].trim()}</p>`,
      )
      continue
    }

    // Aufzählung (— … oder 1. …)
    const isList = lines.length > 1 && lines.every((l) => !l.trim() || BULLET.test(l.trim()) || NUMBERED.test(l.trim()) || /^\s{2,}\S/.test(l))
    if (isList) {
      const items: string[] = []
      for (const l of lines) {
        const t = l.trim()
        if (!t) continue
        if (BULLET.test(t) || NUMBERED.test(t)) items.push(t.replace(BULLET, '').replace(NUMBERED, ''))
        else if (items.length) items[items.length - 1] += ' ' + t   // Fortsetzungszeile
      }
      const numbered = NUMBERED.test(lines[0].trim())
      out.push(
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">` +
        items.map((it, i) => `
          <tr>
            <td style="padding:5px 12px 5px 0;color:${C.gold};font-size:14px;font-weight:700;vertical-align:top;width:24px;">
              ${numbered ? i + 1 + '.' : '&#10022;'}
            </td>
            <td style="padding:5px 0;color:${C.body};font-size:15px;line-height:1.65;">${it}</td>
          </tr>`).join('') +
        `</table>`,
      )
      continue
    }

    // Normaler Absatz (bei vorhandener Box ohne die Termin-Zeilen)
    const kept = opts.hasAppointmentBox ? lines.filter((l) => !APPT_LINE.test(l.trim())) : lines
    const body = kept.join('\n').trim()
    if (body) out.push(`<p style="margin:0 0 17px;line-height:1.7;color:${C.body};font-size:15px;">${body.replace(/\n/g, '<br>')}</p>`)
  }

  return out.join('\n')
}

/** Baut die komplette HTML-Mail im HK-Design um den Text herum. */
export function renderHkEmailHtml({ bodyText, subject, vars = {}, callType }: HkEmailLayoutArgs): string {
  const date = vars.appointment_date || null
  const time = vars.appointment_time || null
  const link = vars.zoom_link || vars.appointment_link || null
  const expert = vars.expert_name || vars.setter_name || vars.closer_name || null
  const duration = vars.appointment_duration || null

  const isCloser = callType === 'closer_call'
  const badge = isCloser ? 'Strategiegespräch' : 'Kostenfreier Experten-Call'

  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:7px 0;color:${C.muted};font-size:13px;letter-spacing:.06em;text-transform:uppercase;width:110px;vertical-align:top;">${label}</td>
      <td style="padding:7px 0;color:${C.ink};font-size:15px;font-weight:600;font-family:Georgia,'Times New Roman',serif;">${value}</td>
    </tr>`

  const appointmentBox =
    date || time || link
      ? `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:${C.panel};border:1px solid ${C.goldSoft};border-radius:4px;margin:4px 0 28px;">
    <tr><td style="padding:22px 24px;">
      <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${C.gold};font-weight:700;margin-bottom:12px;">${badge}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${date ? detailRow('Datum', escapeHtml(date)) : ''}
        ${time ? detailRow('Uhrzeit', `${escapeHtml(time)} Uhr`) : ''}
        ${duration ? detailRow('Dauer', `ca. ${escapeHtml(duration)}`) : ''}
        ${expert ? detailRow('Experte', escapeHtml(expert)) : ''}
        ${
          // Button NUR wenn ein echter Link vorliegt — sonst kein toter Knopf.
          link
            ? `<tr><td colspan="2" style="padding-top:18px;">
                 <a href="${escapeHtml(link)}"
                    style="display:inline-block;background:${C.emerald};color:${C.goldLight};text-decoration:none;
                           font-size:14px;font-weight:600;letter-spacing:.04em;padding:13px 26px;border-radius:3px;
                           border:1px solid ${C.gold};font-family:Georgia,'Times New Roman',serif;">
                   Zum Termin
                 </a>
               </td></tr>`
            : ''
        }
      </table>
    </td></tr>
  </table>`
      : ''

  // Vorschautext im Posteingang (erste sinnvolle Zeile, ohne Anrede)
  const preheader = escapeHtml(
    bodyText.split('\n').map((l) => l.trim())
      .find((l) => l && !/^hallo/i.test(l) && !/^[A-ZÄÖÜ ]{6,}$/.test(l))?.slice(0, 140) || '',
  )

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${C.emeraldDk};font-family:Georgia,'Times New Roman',serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.emeraldDk};padding:36px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:${C.paper};border-radius:5px;overflow:hidden;">

        <!-- Kopf: Smaragd mit goldenem Schriftzug (reiner Text, kein Bild) -->
        <tr>
          <td style="background:${C.emerald};padding:38px 40px 32px;text-align:center;border-bottom:2px solid ${C.gold};">
            <div style="color:${C.goldLight};font-size:11px;letter-spacing:.3em;text-transform:uppercase;margin-bottom:14px;opacity:.65;">Growth Operator</div>
            <div style="color:${C.goldLight};font-size:27px;letter-spacing:.24em;font-weight:400;line-height:1.2;">H K &nbsp;G R O W T H</div>
            <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:14px auto 0;">
              <tr>
                <td style="width:60px;border-top:1px solid ${C.gold};font-size:0;line-height:0;">&nbsp;</td>
                <td style="padding:0 10px;color:${C.gold};font-size:10px;line-height:1;">&#10022;</td>
                <td style="width:60px;border-top:1px solid ${C.gold};font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>
            <div style="color:${C.gold};font-size:10px;letter-spacing:.26em;text-transform:uppercase;margin-top:12px;line-height:1.9;">
              Designing Excellence<br>
              <span style="color:${C.goldLight};opacity:.72;letter-spacing:.22em;">One Step at a Time</span>
            </div>
          </td>
        </tr>

        <!-- Inhalt auf Briefbogen -->
        <tr>
          <td style="padding:40px 40px 34px;color:${C.body};font-size:15px;
                     font-family:Georgia,'Times New Roman',serif;">
            ${appointmentBox}
            ${textToHtml(bodyText, { hasAppointmentBox: !!(date || time || link) })}
          </td>
        </tr>

        <!-- Fuß -->
        <tr>
          <td style="padding:0 40px;">
            <div style="border-top:1px solid ${C.goldSoft};font-size:0;line-height:0;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 32px;color:${C.muted};font-size:12px;line-height:1.75;">
            <span style="color:${C.ink};letter-spacing:.08em;font-size:11px;">HK GROWTH OPERATOR</span>
            &nbsp;·&nbsp; Auftrags- &amp; Prozessautomation &nbsp;·&nbsp; Gummersbach<br>
            <span style="font-size:11px;">Sie erhalten diese Nachricht, weil wir mit Ihnen im geschäftlichen Austausch stehen.
            Möchten Sie keine weiteren Nachrichten, genügt eine kurze Antwort.</span>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
