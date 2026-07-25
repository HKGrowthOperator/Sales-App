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
      out.push('<hr style="border:0;border-top:1px solid #e2e8f0;margin:26px 0;">')
      continue
    }

    // Überschrift (einzeilig, VERSALIEN)
    if (lines.length === 1 && HEADING.test(lines[0].trim())) {
      out.push(
        `<p style="margin:28px 0 10px;font-size:12px;font-weight:700;letter-spacing:.1em;` +
        `text-transform:uppercase;color:#2563eb;">${lines[0].trim()}</p>`,
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
            <td style="padding:3px 10px 3px 0;color:#2563eb;font-size:15px;font-weight:700;vertical-align:top;width:22px;">
              ${numbered ? i + 1 + '.' : '&bull;'}
            </td>
            <td style="padding:3px 0;color:#0f172a;font-size:15px;line-height:1.6;">${it}</td>
          </tr>`).join('') +
        `</table>`,
      )
      continue
    }

    // Normaler Absatz (bei vorhandener Box ohne die Termin-Zeilen)
    const kept = opts.hasAppointmentBox ? lines.filter((l) => !APPT_LINE.test(l.trim())) : lines
    const body = kept.join('\n').trim()
    if (body) out.push(`<p style="margin:0 0 16px;line-height:1.65;color:#0f172a;">${body.replace(/\n/g, '<br>')}</p>`)
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
      <td style="padding:6px 0;color:#64748b;font-size:14px;width:110px;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${value}</td>
    </tr>`

  const appointmentBox =
    date || time || link
      ? `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;margin:8px 0 24px;">
    <tr><td style="padding:18px 22px;">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;font-weight:700;margin-bottom:8px;">${badge}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${date ? detailRow('Datum', escapeHtml(date)) : ''}
        ${time ? detailRow('Uhrzeit', `${escapeHtml(time)} Uhr`) : ''}
        ${duration ? detailRow('Dauer', `ca. ${escapeHtml(duration)}`) : ''}
        ${expert ? detailRow('Ihr Experte', escapeHtml(expert)) : ''}
        ${
          link
            ? `<tr><td colspan="2" style="padding-top:14px;">
                 <a href="${escapeHtml(link)}"
                    style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;
                           font-size:14px;font-weight:700;padding:11px 22px;border-radius:8px;">
                   Zum Termin (Video-Call öffnen)
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
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;
                    box-shadow:0 4px 16px rgba(15,23,42,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:26px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle;">
                <span style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:800;
                             font-size:16px;padding:7px 11px;border-radius:9px;letter-spacing:-.5px;">HK</span>
              </td>
              <td style="vertical-align:middle;padding-left:12px;">
                <div style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-.2px;">HK Growth Operator</div>
                <div style="color:#94a3b8;font-size:11px;letter-spacing:.12em;text-transform:uppercase;margin-top:2px;">Systeme für den Mittelstand</div>
              </td>
            </tr></table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 30px;color:#0f172a;font-size:15px;">
            ${appointmentBox}
            ${textToHtml(bodyText, { hasAppointmentBox: !!(date || time || link) })}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:22px 36px 26px;border-top:1px solid #e2e8f0;background:#f8fafc;
                     color:#94a3b8;font-size:12px;line-height:1.7;">
            <span style="color:#475569;font-weight:600;">HK Growth Operator</span> · Gummersbach<br>
            Sie erhalten diese Nachricht, weil wir mit Ihnen im geschäftlichen Austausch stehen.
            Wenn Sie keine weiteren Nachrichten wünschen, genügt eine kurze Antwort.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
