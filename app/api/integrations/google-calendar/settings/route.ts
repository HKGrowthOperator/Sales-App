import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/integrations/google-calendar/settings
// { action: 'disconnect', user_id? }
// { action: 'blocks', user_id?, blocks: string[] }
//
// „blocks" ist die Liste der Kalendereinträge, über die Termine
// gelegt werden dürfen (z. B. „Deep Work"). Alles andere im
// Google-Kalender gilt als belegt. Ohne diese Liste wäre ein
// durchgeplanter Tag komplett dicht und es gäbe keinen Slot.
//
// Eigene Einstellungen darf jede/r ändern, fremde nur Admins.
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let payload: any
  try { payload = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const svc = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data: me } = await svc.from('profiles').select('role').eq('id', user.id).single()

  const targetId = typeof payload.user_id === 'string' ? payload.user_id : user.id
  if (targetId !== user.id && me?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  if (payload.action === 'disconnect') {
    const { error } = await svc.from('profiles').update({
      google_refresh_token: null,
      google_oauth_connected: false,
    }).eq('id', targetId)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (payload.action === 'blocks') {
    const raw = Array.isArray(payload.blocks) ? payload.blocks : []
    const blocks = raw
      .map((b: unknown) => (typeof b === 'string' ? b.trim() : ''))
      .filter((b: string) => b.length > 0)
      .slice(0, 20)
    const { error } = await svc.from('profiles').update({ google_overridable_blocks: blocks }).eq('id', targetId)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, blocks })
  }

  return NextResponse.json({ error: 'unbekannte Aktion' }, { status: 400 })
}
