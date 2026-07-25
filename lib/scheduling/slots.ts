// ============================================================
// Slot Engine — zentrale Verfügbarkeits-/Slot-Berechnung.
// Interne Availability (availability_rules − Exceptions − Appointments)
// minus optional übergebene externe Belegtzeiten (Google-Kalender).
//
// Diese Datei bleibt bewusst FREI von Google-Abhängigkeiten, weil sie
// auch im Browser läuft (SlotPicker). Die Google-Abfrage steckt in
// slotsServer.ts und reicht ihr Ergebnis hier als externalBusy herein.
// ============================================================

import { BLOCKING_APPOINTMENT_STATUSES } from '@/lib/scheduling/status'

export type SchedRole = 'setter' | 'closer'

export interface Slot {
  userId: string
  userName: string
  roleType: SchedRole
  startAt: string          // ISO (UTC)
  endAt: string            // ISO (UTC)
  timezone: string
  durationMinutes: number
  source: 'internal' | 'google_checked'
  confidence: 'high' | 'internal_only'
  isRecommended: boolean
  reason?: string
}

export interface DaySlots {
  date: string             // YYYY-MM-DD (Berlin)
  label: string            // "Mo, 10.06."
  slots: Slot[]
}

const TZ = 'Europe/Berlin'

// ── Zeitzonen-Helfer: Berlin-Wandzeit → UTC-Date (DST-sicher) ──
function tzOffsetMinutes(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const p: Record<string, string> = {}
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return (asUTC - date.getTime()) / 60000
}
function berlinWallToUtc(y: number, mo: number, d: number, hh: number, mm: number): Date {
  const guess = Date.UTC(y, mo - 1, d, hh, mm, 0)
  const offset = tzOffsetMinutes(new Date(guess), TZ)
  return new Date(guess - offset * 60000)
}
// ISO YYYY-MM-DD in Berlin für ein Date
function berlinDateParts(date: Date): { y: number; mo: number; d: number; weekday: number } {
  const dtf = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
  const p: Record<string, string> = {}
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value
  const [y, mo, d] = p.year ? [+p.year, +p.month, +p.day] : [0, 0, 0]
  // ISO weekday Mo=1..So=7
  const wkMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
  return { y, mo, d, weekday: wkMap[p.weekday] ?? 1 }
}
function ymd(y: number, mo: number, d: number): string {
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function dayLabel(y: number, mo: number, d: number): string {
  const date = new Date(Date.UTC(y, mo - 1, d, 12))
  const wd = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'short' }).format(date)
  return `${wd}, ${String(d).padStart(2, '0')}.${String(mo).padStart(2, '0')}.`
}
function parseHM(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number)
  return { h: h || 0, m: m || 0 }
}

interface Rule {
  user_id: string; role_type: SchedRole; weekday: number
  start_time: string; end_time: string
  slot_duration_minutes: number; buffer_before_minutes: number; buffer_after_minutes: number
  valid_from: string | null; valid_until: string | null
  user?: { id: string; full_name: string | null; is_active: boolean; timezone: string | null }
}
interface Busy { assigned_user_id: string; start: number; end: number }  // epoch ms inkl. Puffer

export interface ExternalBusy { userId: string; start: number; end: number }

export interface GetSlotsArgs {
  supabase: any
  roleType: SchedRole
  from: Date
  to: Date
  durationMinutes?: number
  now?: Date
  /** Belegtzeiten aus externen Kalendern (epoch ms), z. B. Google. */
  externalBusy?: ExternalBusy[]
  /** Wessen externer Kalender tatsächlich abgefragt wurde — nur für die Anzeige. */
  externalCheckedUserIds?: string[]
}

export async function getAvailableSlots(args: GetSlotsArgs): Promise<Slot[]> {
  const { supabase, roleType, from, to } = args
  const now = args.now ?? new Date()

  // 1. Regeln + aktive User
  const { data: rulesRaw } = await supabase
    .from('availability_rules')
    .select('*, user:profiles!availability_rules_user_id_fkey(id, full_name, is_active, timezone)')
    .eq('role_type', roleType)
    .eq('is_active', true)
  const rules: Rule[] = (rulesRaw || []).filter((r: Rule) => r.user?.is_active !== false)
  if (rules.length === 0) return []

  const userIds = [...new Set(rules.map(r => r.user_id))]
  const fp = berlinDateParts(from), tp = berlinDateParts(to)
  const fromYmd = ymd(fp.y, fp.mo, fp.d)
  const toYmd = ymd(tp.y, tp.mo, tp.d)

  // 2. Exceptions
  const { data: exceptions } = await supabase
    .from('availability_exceptions')
    .select('*')
    .in('user_id', userIds)
    .gte('date', fromYmd).lte('date', toYmd)
    .eq('is_active', true)

  // 3. Blockierende Appointments (+ Puffer pro Regel-User)
  const { data: appts } = await supabase
    .from('appointments')
    .select('assigned_user_id, appointment_at, end_at, duration_minutes, status')
    .in('assigned_user_id', userIds)
    .in('status', BLOCKING_APPOINTMENT_STATUSES)
    .gte('appointment_at', new Date(from.getTime() - 24 * 3600e3).toISOString())
    .lte('appointment_at', new Date(to.getTime() + 24 * 3600e3).toISOString())

  // Buffer je User aus Regeln (max)
  const bufBefore = new Map<string, number>(), bufAfter = new Map<string, number>()
  for (const r of rules) {
    bufBefore.set(r.user_id, Math.max(bufBefore.get(r.user_id) ?? 0, r.buffer_before_minutes))
    bufAfter.set(r.user_id, Math.max(bufAfter.get(r.user_id) ?? 0, r.buffer_after_minutes))
  }
  const busy: Busy[] = (appts || []).map((a: any) => {
    const start = new Date(a.appointment_at).getTime()
    const dur = a.duration_minutes || (a.end_at ? (new Date(a.end_at).getTime() - start) / 60000 : 45)
    return {
      assigned_user_id: a.assigned_user_id,
      start: start - (bufBefore.get(a.assigned_user_id) ?? 0) * 60000,
      end: start + dur * 60000 + (bufAfter.get(a.assigned_user_id) ?? 0) * 60000,
    }
  })

  // 3b. Externe Belegtzeiten (Google) — kommen fertig von slotsServer.ts.
  const googleBusy = args.externalBusy || []
  const googleChecked = new Set(args.externalCheckedUserIds || [])

  // 4. Slots erzeugen je Tag/Regel
  const slots: Slot[] = []
  const dayCount = Math.ceil((to.getTime() - from.getTime()) / 86400e3) + 1
  for (let i = 0; i < dayCount; i++) {
    const dayDate = new Date(from.getTime() + i * 86400e3)
    const { y, mo, d, weekday } = berlinDateParts(dayDate)
    const dateStr = ymd(y, mo, d)

    for (const r of rules) {
      if (r.weekday !== weekday) continue
      if (r.valid_from && dateStr < r.valid_from) continue
      if (r.valid_until && dateStr > r.valid_until) continue

      // Exceptions dieses Users/Tages
      const dayEx = (exceptions || []).filter((e: any) => e.user_id === r.user_id && e.date === dateStr)
      const fullBlock = dayEx.find((e: any) => e.type === 'unavailable' && !e.start_time)
      if (fullBlock) continue

      const dur = args.durationMinutes || r.slot_duration_minutes
      const { h: sh, m: sm } = parseHM(r.start_time)
      const { h: eh, m: em } = parseHM(r.end_time)
      const dayStartMin = sh * 60 + sm
      const dayEndMin = eh * 60 + em

      for (let mins = dayStartMin; mins + dur <= dayEndMin; mins += dur) {
        const slotStart = berlinWallToUtc(y, mo, d, Math.floor(mins / 60), mins % 60)
        const slotEnd = new Date(slotStart.getTime() + dur * 60000)
        if (slotStart.getTime() < now.getTime()) continue

        // partielle unavailable-Exception
        const blockedByEx = dayEx.some((e: any) => {
          if (e.type !== 'unavailable' || !e.start_time) return false
          const s = parseHM(e.start_time), en = parseHM(e.end_time || e.start_time)
          const exS = berlinWallToUtc(y, mo, d, s.h, s.m).getTime()
          const exE = berlinWallToUtc(y, mo, d, en.h, en.m).getTime()
          return slotStart.getTime() < exE && slotEnd.getTime() > exS
        })
        if (blockedByEx) continue

        // Appointment-Kollision
        const collides = busy.some(b =>
          b.assigned_user_id === r.user_id &&
          slotStart.getTime() < b.end && slotEnd.getTime() > b.start)
        if (collides) continue

        // Google-Kollision (Einträge außerhalb der freigegebenen Fokusblöcke)
        const collidesGoogle = googleBusy.some(b =>
          b.userId === r.user_id &&
          slotStart.getTime() < b.end && slotEnd.getTime() > b.start)
        if (collidesGoogle) continue

        const viaGoogle = googleChecked.has(r.user_id)
        slots.push({
          userId: r.user_id,
          userName: r.user?.full_name || 'HK',
          roleType,
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
          timezone: r.user?.timezone || TZ,
          durationMinutes: dur,
          source: viaGoogle ? 'google_checked' : 'internal',
          confidence: viaGoogle ? 'high' : 'internal_only',
          isRecommended: false,
        })
      }
    }
  }

  // 5. Sortieren + Empfehlungen markieren (früheste 2 Slots)
  slots.sort((a, b) => a.startAt.localeCompare(b.startAt) || a.userName.localeCompare(b.userName))
  slots.slice(0, 2).forEach(s => { s.isRecommended = true; s.reason = 'Frühester Termin' })
  return slots
}

// Serverseitige Validierung: liegt startAt für diesen User/Rolle wirklich in
// einem buchbaren Slot (Arbeitszeit, nicht Urlaub/Blocker, nicht Vergangenheit)?
// Nutzt dieselbe Engine wie die Anzeige → keine stale/manipulierten Slots.
export async function isSlotBookable(args: {
  supabase: any; roleType: SchedRole; assignedUserId: string
  startAt: string; durationMinutes?: number; now?: Date
  externalBusy?: ExternalBusy[]
}): Promise<boolean> {
  const start = new Date(args.startAt)
  const slots = await getAvailableSlots({
    supabase: args.supabase, roleType: args.roleType,
    from: start, to: start, durationMinutes: args.durationMinutes, now: args.now,
    externalBusy: args.externalBusy,
  })
  const target = start.toISOString()
  return slots.some(s => s.userId === args.assignedUserId && s.startAt === target)
}

// Slots nach Berlin-Tag gruppieren (für UI)
export function groupSlotsByDay(slots: Slot[]): DaySlots[] {
  const map = new Map<string, Slot[]>()
  for (const s of slots) {
    const { y, mo, d } = berlinDateParts(new Date(s.startAt))
    const key = ymd(y, mo, d)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, slots]) => {
    const [yy, mm, dd] = date.split('-').map(Number)
    return { date, label: dayLabel(yy, mm, dd), slots }
  })
}

// Berlin-formatierte Uhrzeit eines ISO-Slots (für UI)
export function slotTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}
