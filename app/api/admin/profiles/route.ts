import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/admin/profiles — Rolle/Aktiv-Status eines Nutzers setzen
// ------------------------------------------------------------
// Nur für Admins. Serverseitig geprüft (nicht nur UI). Service-Role,
// damit RLS auf profiles nicht blockiert.
// Body: { id: string, role?: 'opener'|'setter'|'closer'|'admin', is_active?: boolean, full_name?: string }
// ============================================================

const ROLES = new Set(['opener', 'setter', 'closer', 'admin'])

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden', detail: 'Nur Admins dürfen Rollen ändern.' }, { status: 403 })
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const id = typeof body?.id === 'string' ? body.id : null
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.role === 'string') {
    if (!ROLES.has(body.role)) return NextResponse.json({ error: 'ungültige Rolle' }, { status: 400 })
    update.role = body.role
  }
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active
  if (typeof body.full_name === 'string' && body.full_name.trim()) update.full_name = body.full_name.trim().slice(0, 120)

  // Sicherung: der letzte aktive Admin darf sich nicht selbst die Admin-Rolle/Aktiv nehmen
  if ((update.role && update.role !== 'admin') || update.is_active === false) {
    if (id === me.id) {
      const svcCheck = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
      const { count } = await svcCheck.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin').eq('is_active', true)
      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: 'last_admin', detail: 'Du bist der einzige aktive Admin — Rolle kann nicht entzogen werden.' }, { status: 409 })
      }
    }
  }

  const svc = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
  const { data, error } = await svc.from('profiles').update(update).eq('id', id).select('id, role, is_active, full_name, email').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, profile: data })
}
