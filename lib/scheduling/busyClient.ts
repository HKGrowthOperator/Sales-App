import { ExternalBusy, SchedRole } from '@/lib/scheduling/slots'

// ============================================================
// Google-Belegtzeiten für Code, der auch im Browser läuft.
// ------------------------------------------------------------
// Das Verschieben von Terminen (appointmentActions) wird sowohl vom
// Server als auch aus einer Client-Komponente aufgerufen. Die
// Google-Bibliothek darf dort nicht hinein — also holen wir die
// belegten Zeiten über die API.
//
// Kein Ergebnis (offline, nicht angemeldet, Google aus) bedeutet:
// keine externen Sperren. Die interne Prüfung greift weiterhin.
// ============================================================

export async function fetchGoogleBusyViaApi(roleType: SchedRole, around: Date): Promise<ExternalBusy[]> {
  try {
    const from = new Date(around.getTime() - 24 * 3600e3)
    const to = new Date(around.getTime() + 24 * 3600e3)
    const res = await fetch(
      `/api/scheduling/busy?role=${roleType}&from=${from.toISOString()}&to=${to.toISOString()}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return []
    const out = await res.json()
    return Array.isArray(out?.busy) ? out.busy : []
  } catch {
    return []
  }
}
