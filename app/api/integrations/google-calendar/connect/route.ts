import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildConsentUrl, googleOAuthConfigured, redirectUri } from '@/lib/integrations/googleAuth'

export const dynamic = 'force-dynamic'

// GET /api/integrations/google-calendar/connect
// Schickt die angemeldete Person zur Google-Zustimmung. Jede/r verbindet
// den eigenen Kalender — deshalb keine Admin-Prüfung.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', process.env.APP_URL || 'http://localhost:3000'))

  if (!googleOAuthConfigured()) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET fehlen in den Umgebungsvariablen.' },
      { status: 503 },
    )
  }
  if (!redirectUri().startsWith('http')) {
    return NextResponse.json(
      { error: 'APP_URL fehlt — ohne sie kann Google nicht zurückleiten.' },
      { status: 503 },
    )
  }

  return NextResponse.redirect(buildConsentUrl(user.id))
}
