import { calendarClientForUser } from '@/lib/integrations/googleAuth'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// ============================================================
// Belegtzeiten aus Google — mit Ausnahmeliste.
// ------------------------------------------------------------
// Bewusst NICHT über die freeBusy-Abfrage: die liefert nur Zeiträume
// ohne Titel. Wir brauchen aber die Titel, weil durchgeplante Kalender
// (Deep Work, Fokus, Pause …) sonst jeden Tag komplett blockieren und
// gar kein Termin mehr vorgeschlagen werden könnte.
//
// Regel: Ein Eintrag blockiert, AUSSER
//   — er ist als „frei" markiert (transparency: transparent),
//   — er wurde von der Person abgelehnt,
//   — sein Titel enthält einen Begriff aus der Ausnahmeliste.
// ============================================================

export interface BusyInterval {
  userId: string
  start: number   // epoch ms
  end: number
}

/** Standard, wenn noch nichts gepflegt ist — deckt die üblichen Fokusblöcke ab. */
export const DEFAULT_OVERRIDABLE_BLOCKS = ['Deep Work']

function svc() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

/** Titelvergleich: ohne Groß-/Kleinschreibung, Emoji und Nummerierung stören nicht. */
export function isOverridable(summary: string | null | undefined, blocks: string[]): boolean {
  if (!summary) return false
  const s = summary.toLowerCase()
  return blocks.some(b => b && s.includes(b.toLowerCase()))
}

/**
 * Holt die belegten Zeiträume der angegebenen Personen aus deren
 * Google-Kalendern. Personen ohne Verbindung werden still übersprungen —
 * für sie gilt weiterhin nur die in der App gepflegte Verfügbarkeit.
 *
 * Fehler einzelner Kalender dürfen die Terminsuche nie zum Absturz
 * bringen; im Zweifel gibt es lieber einen Slot zu viel als eine leere
 * Auswahl.
 */
export async function getGoogleBusy(
  userIds: string[], from: Date, to: Date,
): Promise<{ busy: BusyInterval[]; checked: string[] }> {
  const empty = { busy: [], checked: [] }
  if (!userIds.length) return empty
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return empty

  const { data: profiles } = await svc()
    .from('profiles')
    .select('id, google_refresh_token, google_overridable_blocks')
    .in('id', userIds)

  const connected = (profiles || []).filter((p: any) => !!p.google_refresh_token)
  if (!connected.length) return empty

  const checked: string[] = []
  const results = await Promise.all(connected.map(async (p: any) => {
    try {
      const client = await calendarClientForUser(p.id)
      if (!client) return []
      const blocks: string[] = Array.isArray(p.google_overridable_blocks) && p.google_overridable_blocks.length
        ? p.google_overridable_blocks
        : DEFAULT_OVERRIDABLE_BLOCKS

      const res = await client.calendar.events.list({
        calendarId: client.calendarId,
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        singleEvents: true,          // Serien in Einzeltermine auflösen
        orderBy: 'startTime',
        maxResults: 2500,
      })

      const out: BusyInterval[] = []
      for (const ev of res.data.items || []) {
        if (ev.status === 'cancelled') continue
        if (ev.transparency === 'transparent') continue          // in Google als „frei" markiert
        const self = (ev.attendees || []).find(a => a.self)
        if (self?.responseStatus === 'declined') continue
        if (isOverridable(ev.summary, blocks)) continue          // Fokusblock — darf überschrieben werden

        // Ganztägige Einträge (nur .date) blockieren den kompletten Tag.
        const startIso = ev.start?.dateTime || (ev.start?.date ? `${ev.start.date}T00:00:00Z` : null)
        const endIso = ev.end?.dateTime || (ev.end?.date ? `${ev.end.date}T00:00:00Z` : null)
        if (!startIso || !endIso) continue

        const start = new Date(startIso).getTime()
        const end = new Date(endIso).getTime()
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue
        out.push({ userId: p.id, start, end })
      }
      checked.push(p.id)
      return out
    } catch {
      // Kalender nicht erreichbar → diese Person wird wie „nicht verbunden"
      // behandelt, statt die gesamte Slot-Suche scheitern zu lassen.
      return []
    }
  }))

  return { busy: results.flat(), checked }
}
