import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/admin/scripts — Master-Skript anlegen/ändern/löschen
// Nur Admin. Service-Role (RLS umgangen). Body:
//   { action: 'save', script: {...} }  → upsert (mit id = update)
//   { action: 'delete', id }
// Skripte werden als script_type='master', status='approved' gespeichert.
// ============================================================

const ROLES = new Set(['Opener', 'Setter', 'Closer'])

async function requireAdmin(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const { data: me } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
  if (!me || me.role !== 'admin') return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { user, svc: createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } }) }
}

function toLines(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  if (typeof v === 'string') return v.split('\n').map((s) => s.trim()).filter(Boolean)
  return []
}

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin(req)
  if ('error' in ctx) return ctx.error
  const { user, svc } = ctx

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  if (body.action === 'delete') {
    const id = typeof body.id === 'string' ? body.id : null
    if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
    const { error } = await svc.from('scripts').delete().eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const s = body.script || {}
  const role = String(s.role || '')
  if (!ROLES.has(role)) return NextResponse.json({ error: 'Rolle (Opener/Setter/Closer) fehlt' }, { status: 400 })
  if (!s.title || !String(s.title).trim()) return NextResponse.json({ error: 'Titel fehlt' }, { status: 400 })

  const row: Record<string, unknown> = {
    role,
    entry_angle: s.entry_angle || null,
    industry: s.industry || null,
    title: String(s.title).trim(),
    positioning: s.positioning || null,
    opening_line: s.opening_line || null,
    relevance_line: s.relevance_line || null,
    core_question: s.core_question || null,
    transition_line: s.transition_line || null,
    call_goal: s.call_goal || null,
    full_script: s.full_script || null,
    tone_guidance: s.tone_guidance || null,
    method_name: s.method_name || null,
    qualifying_questions_json: toLines(s.qualifying_questions_json),
    script_type: 'master',
    status: 'approved',
    is_active: true,
    updated_at: new Date().toISOString(),
  }

  if (s.id) {
    const { data, error } = await svc.from('scripts').update(row).eq('id', s.id).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, script: data })
  } else {
    row.version = 1
    row.created_by = user.id
    row.approved_by = user.id
    row.approved_at = new Date().toISOString()
    const { data, error } = await svc.from('scripts').insert(row).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, script: data })
  }
}
