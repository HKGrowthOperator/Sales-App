// ============================================================
// sendLead — entkoppelte Lead-Contract-Übergabe (opt-in via
// RADAR_EMIT_CONTRACT=1 im Ingest). Fire-and-forget, darf den
// Ingest NIE brechen.
// ------------------------------------------------------------
// Mit N8N_RADAR_WEBHOOK_URL: POST an den n8n-Webhook (Secret im
// Header). Ohne URL: Stub → lokale In-Memory-Outbox + Log.
// ============================================================

const outbox = []

/** Übergibt einen Lead-Contract an das Empfänger-System.
 *  Gibt { ok, delivered, error? } zurück und wirft nie. */
export async function sendLead(contract) {
  const url = process.env.N8N_RADAR_WEBHOOK_URL || ''
  const secret = process.env.N8N_RADAR_WEBHOOK_SECRET || process.env.RADAR_INGEST_SECRET || ''

  if (!url) {
    // Stub: lokale Outbox (In-Memory), damit der Pfad testbar bleibt.
    outbox.push({ at: new Date().toISOString(), contract })
    if (outbox.length > 200) outbox.shift()
    console.log(`[sendLead] Outbox (kein N8N_RADAR_WEBHOOK_URL): ${contract?.company?.name || contract?.lead_id}`)
    return { ok: true, delivered: false }
  }

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        ...(secret ? { 'x-radar-secret': secret } : {}),
      },
      body: JSON.stringify(contract),
    })
    clearTimeout(t)
    if (!res.ok) return { ok: false, delivered: false, error: `HTTP ${res.status}` }
    return { ok: true, delivered: true }
  } catch (e) {
    return { ok: false, delivered: false, error: e?.message || String(e) }
  }
}

/** Liest die lokale Stub-Outbox (nur für Debug/Tests). */
export function getOutbox() {
  return [...outbox]
}
