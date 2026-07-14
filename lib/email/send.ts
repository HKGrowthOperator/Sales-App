// ============================================================
// E-Mail-Versand via Resend (https://resend.com).
// Konfiguration: RESEND_API_KEY + EMAIL_FROM in der Umgebung.
// Ohne beides ist emailConfigured() false und der Runner
// überspringt den Versand (skipped) — nichts geht kaputt.
// ============================================================

export interface SendEmailArgs {
  to: string
  subject: string
  body: string // Plain-Text
  html?: string
  replyTo?: string
}

export interface SendEmailResult {
  ok: boolean
  id?: string
  error?: string
}

export function emailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  if (!emailConfigured()) {
    return { ok: false, error: 'E-Mail nicht konfiguriert (RESEND_API_KEY + EMAIL_FROM setzen)' }
  }
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 15000)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [args.to],
        subject: args.subject,
        text: args.body,
        ...(args.html ? { html: args.html } : {}),
        ...(args.replyTo || process.env.EMAIL_REPLY_TO
          ? { reply_to: args.replyTo || process.env.EMAIL_REPLY_TO }
          : {}),
      }),
    })
    clearTimeout(t)
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, error: data?.message || `Resend HTTP ${res.status}` }
    }
    return { ok: true, id: data?.id }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}
