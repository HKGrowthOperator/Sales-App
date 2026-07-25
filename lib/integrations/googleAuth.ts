import { google } from 'googleapis'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// Google-OAuth pro Person.
// ------------------------------------------------------------
// Jeder im Team verbindet seinen EIGENEN Kalender. Nur so kann ein
// Setter-Call im Kalender des zuständigen Setters landen und nicht in
// einem gemeinsamen Sammelkalender.
//
// Der ältere Weg über einen einzelnen GOOGLE_REFRESH_TOKEN aus den
// Umgebungsvariablen bleibt als Rückfallebene bestehen, damit
// bestehende Installationen nicht brechen.
// ============================================================

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
]

export function googleOAuthConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

/** Basis-URL der App — für die Redirect-URI, die auch in Google Cloud hinterlegt ist. */
function appBaseUrl(): string {
  const raw = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  return raw.replace(/\/+$/, '')
}

export function redirectUri(): string {
  return `${appBaseUrl()}/api/integrations/google-calendar/callback`
}

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri(),
  )
}

// ── State: signiert, damit der Callback nicht fremdgesteuert werden kann ──
// Kein Sessionspeicher nötig; die Signatur trägt die Information selbst.
function stateSecret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CRON_SECRET || 'hk-fallback'
}

export function signState(userId: string, now: number = Date.now()): string {
  const payload = `${userId}.${now}`
  const sig = crypto.createHmac('sha256', stateSecret()).update(payload).digest('base64url')
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

/** Prüft Signatur und Alter (max. 15 Minuten). Gibt die User-ID zurück oder null. */
export function verifyState(state: string | null): string | null {
  if (!state) return null
  const [encoded, sig] = state.split('.')
  if (!encoded || !sig) return null
  let payload: string
  try { payload = Buffer.from(encoded, 'base64url').toString('utf8') } catch { return null }
  const expected = crypto.createHmac('sha256', stateSecret()).update(payload).digest('base64url')
  // Zeitkonstanter Vergleich — verhindert, dass sich die Signatur erraten lässt.
  const a = Buffer.from(sig), b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  const [userId, ts] = payload.split('.')
  if (!userId || !ts) return null
  if (Date.now() - Number(ts) > 15 * 60_000) return null
  return userId
}

export function buildConsentUrl(userId: string): string {
  return oauthClient().generateAuthUrl({
    access_type: 'offline',
    // 'consent' erzwingt, dass Google ein Refresh-Token liefert — ohne das
    // kommt bei einer zweiten Verbindung nur ein Access-Token zurück.
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
    state: signState(userId),
    include_granted_scopes: true,
  })
}

export async function exchangeCodeForRefreshToken(code: string): Promise<{ refreshToken: string | null; email: string | null }> {
  const client = oauthClient()
  const { tokens } = await client.getToken(code)
  let email: string | null = null
  try {
    client.setCredentials(tokens)
    const info = await google.oauth2({ version: 'v2', auth: client }).userinfo.get()
    email = info.data.email || null
  } catch { /* Adresse ist nur Anzeige — Fehler darf die Verbindung nicht kippen */ }
  return { refreshToken: tokens.refresh_token || null, email }
}

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

/**
 * Kalender-Client für eine bestimmte Person.
 * Reihenfolge: persönlicher Token → gemeinsamer Token aus den Umgebungsvariablen.
 * Gibt null zurück, wenn beides fehlt — Aufrufer entscheiden dann selbst,
 * ob das ein Fehler ist oder still übersprungen wird.
 */
export async function calendarClientForUser(userId: string | null | undefined) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  let refreshToken: string | null = null
  let calendarId = 'primary'

  if (userId) {
    const { data } = await serviceClient()
      .from('profiles')
      .select('google_refresh_token, google_calendar_id')
      .eq('id', userId)
      .maybeSingle()
    if (data?.google_refresh_token) {
      refreshToken = data.google_refresh_token
      calendarId = data.google_calendar_id || 'primary'
    }
  }

  if (!refreshToken) {
    refreshToken = process.env.GOOGLE_REFRESH_TOKEN || null
    calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'
  }
  if (!refreshToken) return null

  const auth = new google.auth.OAuth2(clientId, clientSecret)
  auth.setCredentials({ refresh_token: refreshToken })
  return { calendar: google.calendar({ version: 'v3', auth }), calendarId }
}
