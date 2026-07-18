import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// ============================================================
// POST /api/leads/upload/sheet — Google Sheet als CSV holen
// ------------------------------------------------------------
// Das Upload-UI schickt einen Google-Sheets-Link; wir holen serverseitig
// den CSV-Export (umgeht CORS im Browser). Funktioniert für Sheets, die
// per Link freigegeben sind ("Jeder mit dem Link kann ansehen").
// Body: { url: string }  →  { ok: true, csv: string }
// ============================================================

const SHEET_RE = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const url = typeof body?.url === 'string' ? body.url.trim() : ''
  const match = url.match(SHEET_RE)
  if (!match) {
    return NextResponse.json(
      { error: 'invalid_url', detail: 'Kein gültiger Google-Sheets-Link (docs.google.com/spreadsheets/…).' },
      { status: 400 },
    )
  }

  const sheetId = match[1]
  const gidMatch = url.match(/[#&?]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : null
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(exportUrl, { redirect: 'follow', signal: controller.signal })
    clearTimeout(timer)

    const text = await res.text()
    // Nicht freigegebene Sheets liefern die Google-Login-Seite (HTML) oder 4xx.
    if (!res.ok || /^\s*<(!doctype|html)/i.test(text)) {
      return NextResponse.json(
        {
          error: 'sheet_not_public',
          detail: 'Sheet nicht erreichbar. Freigabe auf "Jeder mit dem Link kann ansehen" stellen und erneut versuchen.',
        },
        { status: 422 },
      )
    }
    if (text.length > 5_000_000) {
      return NextResponse.json({ error: 'sheet_too_large' }, { status: 413 })
    }
    return NextResponse.json({ ok: true, csv: text })
  } catch {
    return NextResponse.json(
      { error: 'fetch_failed', detail: 'Google Sheet konnte nicht geladen werden (Timeout/Netzwerk).' },
      { status: 502 },
    )
  }
}
