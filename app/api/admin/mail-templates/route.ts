import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ============================================================
// POST /api/admin/mail-templates — Mail-Vorlagen pflegen
// Nur Admin. Vorlagen aus email_templates haben Vorrang vor den
// eingebauten Texten (siehe lib/email/templates.ts selectTemplate).
// Body: { action: 'save', template: {...} } | { action: 'delete', id }
// ============================================================

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const { data: me } = await supabase.from('profiles').select('id, role').eq('id', user.id).single()
  if (!me || me.role !== 'admin') return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  return { svc: createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } }) }
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
    const { error } = await svc.from('email_templates').delete().eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  const t = body.template || {}
  if (!t.key || !String(t.key).trim()) return NextResponse.json({ error: 'Vorlagen-Schlüssel fehlt' }, { status: 400 })
  if (!t.subject || !t.body_text) return NextResponse.json({ error: 'Betreff und Text nötig' }, { status: 400 })

  const row: Record<string, unknown> = {
    key: String(t.key).trim(),
    product_area: t.product_area || null,
    subject: String(t.subject).trim(),
    body_text: String(t.body_text),
    is_active: t.is_active !== false,
    updated_at: new Date().toISOString(),
  }

  if (t.id) {
    const { data, error } = await svc.from('email_templates').update(row).eq('id', t.id).select('*').single()
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, template: data })
  }
  const { data, error } = await svc.from('email_templates').insert(row).select('*').single()
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, template: data })
}
