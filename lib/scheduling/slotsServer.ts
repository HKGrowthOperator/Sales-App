import 'server-only'
import { getAvailableSlots, isSlotBookable, GetSlotsArgs, SchedRole, Slot } from '@/lib/scheduling/slots'
import { getGoogleBusy } from '@/lib/integrations/googleBusy'

// ============================================================
// Serverseitige Slot-Berechnung inklusive Google-Kalender.
// ------------------------------------------------------------
// slots.ts bleibt browser-tauglich; die Google-Bibliothek läuft
// ausschließlich hier. Fällt Google aus, bleibt es bei der internen
// Verfügbarkeit — lieber ein Slot zu viel als eine leere Auswahl.
// ============================================================

async function busyFor(supabase: any, roleType: SchedRole, from: Date, to: Date) {
  try {
    const { data: rules } = await supabase
      .from('availability_rules')
      .select('user_id')
      .eq('role_type', roleType)
      .eq('is_active', true)
    const userIds = [...new Set((rules || []).map((r: any) => r.user_id as string))] as string[]
    if (!userIds.length) return { busy: [], checked: [] }

    // Fensterrand großzügig: isSlotBookableServer ruft mit from == to auf,
    // sonst wäre das abgefragte Zeitfenster leer.
    return await getGoogleBusy(
      userIds,
      new Date(from.getTime() - 24 * 3600e3),
      new Date(to.getTime() + 24 * 3600e3),
    )
  } catch {
    return { busy: [], checked: [] }
  }
}

export async function getAvailableSlotsWithGoogle(args: GetSlotsArgs): Promise<Slot[]> {
  const g = await busyFor(args.supabase, args.roleType, args.from, args.to)
  return getAvailableSlots({ ...args, externalBusy: g.busy, externalCheckedUserIds: g.checked })
}

export async function isSlotBookableServer(args: {
  supabase: any; roleType: SchedRole; assignedUserId: string
  startAt: string; durationMinutes?: number; now?: Date
}): Promise<boolean> {
  const start = new Date(args.startAt)
  const g = await busyFor(args.supabase, args.roleType, start, start)
  return isSlotBookable({ ...args, externalBusy: g.busy })
}
