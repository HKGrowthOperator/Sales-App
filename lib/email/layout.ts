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

function textToHtml(text: string): string {
  return escapeHtml(text.trim())
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')
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

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;
                    box-shadow:0 1px 3px rgba(15,23,42,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:22px 32px;">
            <span style="display:inline-block;background:#2563eb;color:#ffffff;font-weight:800;
                         font-size:15px;padding:6px 10px;border-radius:8px;letter-spacing:-.5px;">HK</span>
            <span style="color:#e2e8f0;font-size:13px;letter-spacing:.14em;text-transform:uppercase;
                         font-weight:600;margin-left:10px;">HK Growth Operator</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;color:#0f172a;font-size:15px;">
            ${appointmentBox}
            ${textToHtml(bodyText)}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;line-height:1.6;">
            HK Growth Operator · Gummersbach<br>
            Diese E-Mail wurde im Rahmen Ihrer Terminvereinbarung versendet.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
