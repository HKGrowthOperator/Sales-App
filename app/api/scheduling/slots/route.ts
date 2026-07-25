import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAvailableSlotsWithGoogle } from '@/lib/scheduling/slotsServer'

export const dynamic = 'force-dynamic'

// GET /api/scheduling/slots?role=setter&from=ISO&to=ISO&duration=45
// Der SlotPicker läuft im Browser und kann Google nicht abfragen.
// Deshalb holt er die Slots hier — sonst würde er Zeiten anbieten,
// die der Server beim Buchen wieder ablehnt.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const p = req.nextUrl.searchParams
  const role = p.get('role') === 'closer' ? 'closer' : 'setter'
  const from = p.get('from') ? new Date(p.get('from')!) : new Date()
  const to = p.get('to') ? new Date(p.get('to')!) : new Date(Date.now() + 14 * 86400e3)
  const durationRaw = Number(p.get('duration'))
  const duration = Number.isFinite(durationRaw) && durationRaw > 0 ? durationRaw : undefined

  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) {
    return NextResponse.json({ error: 'ungültiger Zeitraum' }, { status: 400 })
  }

  try {
    const slots = await getAvailableSlotsWithGoogle({
      supabase, roleType: role, from, to, durationMinutes: duration,
    })
    return NextResponse.json({ ok: true, slots })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
