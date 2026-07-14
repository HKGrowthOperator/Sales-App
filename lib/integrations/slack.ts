// ============================================================
// Slack-Versand (Incoming Webhook). Hart gegated: ohne
// SLACK_WEBHOOK_URL wird NIE gesendet (skipped). Analog email/send.
// ============================================================
export type SlackResult = { ok: true } | { ok: false; skipped?: boolean; error: string }

export function slackConfigured(): boolean {
  return !!process.env.SLACK_WEBHOOK_URL
}

export async function sendSlack(text: string): Promise<SlackResult> {
  if (!slackConfigured()) return { ok: false, skipped: true, error: 'Slack nicht konfiguriert (SLACK_WEBHOOK_URL fehlt)' }
  try {
    const res = await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) return { ok: false, error: `Slack HTTP ${res.status}` }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) }
  }
}
