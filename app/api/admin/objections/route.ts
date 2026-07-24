import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/admin/objections — Einwand-Bibliothek verwalten
// Nur Admin. Service-Role. Body:
//   { action: 'save', objection: {...} }         → upsert
//   { action: 'delete', id }
//   { action: 'bulk', role, entry_angle, text }  → je Zeile "Label | Antwort"
// ============================================================

const ROLES = new Set(['Opener', 'Setter', 'Closer'])

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const { data: me } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
  if (!me || me.role !== 'admin') return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { svc: createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } }) }
}

function slug(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'einwand'
}

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin()
  if ('error' in ctx) return ctx.error
  const { svc } = ctx

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (body.action === 'delete') {
    const id = typeof body.id === 'string' ? body.id : null
    if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
    const { error } = await svc.from('objection_library').delete().eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'bulk') {
    const role = ROLES.has(String(body.role)) ? String(body.role) : null
    const entry_angle = body.entry_angle || null
    const lines = String(body.text || '').split('\n').map((l: string) => l.trim()).filter(Boolean)
    if (!lines.length) return NextResponse.json({ error: 'kein Text' }, { status: 400 })
    const rows = lines.map((line: string, i: number) => {
      const [label, ...rest] = line.split('|')
      return {
        key: `${slug(label || 'einwand')}-${Date.now()}-${i}`,
        role, entry_angle,
        objection_label: (label || '').trim(),
        response: rest.join('|').trim(),
        sort_order: i,
        is_active: true,
      }
    }).filter((r: any) => r.objection_label && r.response)
    if (!rows.length) return NextResponse.json({ error: 'Format: „Label | Antwort" je Zeile' }, { status: 400 })
    const { data, error } = await svc.from('objection_library').insert(rows).select('id')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, inserted: data?.length || 0 })
  }

  // save (upsert)
  const o = body.objection || {}
  if (!o.objection_label || !o.response) return NextResponse.json({ error: 'Einwand + Antwort nötig' }, { status: 400 })
  const row: Record<string, unknown> = {
    role: ROLES.has(String(o.role)) ? String(o.role) : null,
    entry_angle: o.entry_angle || null,
    objection_label: String(o.objection_label).trim(),
    response: String(o.response).trim(),
    psychology_note: o.psychology_note || null,
    sort_order: Number.isFinite(+o.sort_order) ? +o.sort_order : 0,
    is_active: o.is_active !== false,
  }
  if (o.id) {
    const { data, error } = await svc.from('objection_library').update(row).eq('id', o.id).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, objection: data })
  } else {
    row.key = `${slug(row.objection_label as string)}-${Date.now()}`
    const { data, error } = await svc.from('objection_library').insert(row).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, objection: data })
  }
}
