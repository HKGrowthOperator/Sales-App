import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { runDueJobs } from '@/lib/jobs/runner'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function authorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const header = req.headers.get('x-cron-secret')
      || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    if (header && header === secret) return true
  }
  // Fallback: eingeloggter Admin (für „Jobs jetzt ausführen"-Button)
  try {
    const sb = await createServerClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user) {
      const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single()
      if (p?.role === 'admin') return true
    }
  } catch {}
  return false
}

async function handle(req: NextRequest) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  try {
    const summary = await runDueJobs(svc)
    return NextResponse.json({ ok: true, summary })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
