import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleBusy } from '@/lib/integrations/googleBusy'

export const dynamic = 'force-dynamic'

// GET /api/scheduling/busy?role=setter&from=ISO&to=ISO
// Liefert nur Zeiträume (epoch ms) — keine Titel, keine Inhalte.
// Damit kann der Browser prüfen, ob ein Slot frei ist, ohne dass
// Kalenderinhalte den Server verlassen.
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const p = req.nextUrl.searchParams
  const role = p.get('role') === 'closer' ? 'closer' : 'setter'
  const from = p.get('from') ? new Date(p.get('from')!) : new Date()
  const to = p.get('to') ? new Date(p.get('to')!) : new Date(Date.now() + 7 * 86400e3)
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime())) {
    return NextResponse.json({ error: 'ungültiger Zeitraum' }, { status: 400 })
  }

  try {
    const { data: rules } = await supabase
      .from('availability_rules').select('user_id')
      .eq('role_type', role).eq('is_active', true)
    const userIds = [...new Set((rules || []).map((r: any) => r.user_id as string))] as string[]
    if (!userIds.length) return NextResponse.json({ ok: true, busy: [] })

    const g = await getGoogleBusy(userIds, from, to)
    return NextResponse.json({ ok: true, busy: g.busy })
  } catch {
    // Kein harter Fehler: ohne externe Sperren greift die interne Prüfung.
    return NextResponse.json({ ok: true, busy: [] })
  }
}
