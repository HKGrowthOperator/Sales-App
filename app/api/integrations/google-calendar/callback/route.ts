import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { exchangeCodeForRefreshToken, verifyState } from '@/lib/integrations/googleAuth'

export const dynamic = 'force-dynamic'

// GET /api/integrations/google-calendar/callback
// Google leitet hierher zurück. Der State ist signiert und trägt die
// User-ID — deshalb braucht es keinen Sessionspeicher, und ein fremder
// Aufruf kann keine Verbindung auf ein anderes Konto schreiben.

function back(msg: string, ok: boolean) {
  const base = (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
  const url = new URL(`${base}/admin/availability`)
  url.searchParams.set(ok ? 'google' : 'google_error', msg)
  return NextResponse.redirect(url)
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams

  const denied = params.get('error')
  if (denied) return back('Zugriff in Google abgelehnt', false)

  const userId = verifyState(params.get('state'))
  if (!userId) return back('Sicherheitsprüfung fehlgeschlagen — bitte erneut verbinden', false)

  const code = params.get('code')
  if (!code) return back('Google hat keinen Code zurückgegeben', false)

  try {
    const { refreshToken, email } = await exchangeCodeForRefreshToken(code)
    if (!refreshToken) {
      // Passiert, wenn der Zugriff schon einmal erteilt wurde und Google
      // deshalb kein neues Refresh-Token schickt.
      return back('Kein dauerhafter Zugriff erhalten — in Google unter „Drittanbieter-Apps" trennen und erneut verbinden', false)
    }

    const svc = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const { error } = await svc.from('profiles').update({
      google_refresh_token: refreshToken,
      google_calendar_id: email || 'primary',
      google_oauth_connected: true,
    }).eq('id', userId)
    if (error) return back(error.message, false)

    return back(email ? `verbunden mit ${email}` : 'verbunden', true)
  } catch (e: any) {
    return back(e?.message || 'Verbindung fehlgeschlagen', false)
  }
}
