import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { RadarScanRequest } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// POST /api/radar/scan
// Startet einen KI-Research-Lauf: legt eine radar_scans-Zeile an und triggert
// den n8n-Webhook auf dem Terra-Server. n8n recherchiert, kuratiert, bewertet
// und schreibt die Treffer via Service-Role nach radar_targets; den Scan-Status
// aktualisiert n8n direkt in radar_scans. Diese Route TRIGGERT nur.
export async function POST(req: NextRequest) {
  // 1. Admin-Gate (RLS greift zusätzlich beim Insert)
  const sb = await createServerClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // 2. Eingaben validieren
  let body: RadarScanRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const region = (body.region || '').trim()
  const search_scope = (body.search_scope || '').trim()
  if (!region || !search_scope) {
    return NextResponse.json({ error: 'region_and_search_scope_required' }, { status: 400 })
  }
  const desired_count = Math.min(Math.max(Number(body.desired_count) || 20, 1), 200)

  // 3. Scan-Zeile anlegen (status='queued')
  const { data: scan, error: insErr } = await sb
    .from('radar_scans')
    .insert({
      requested_by: user.id,
      region,
      radius_km: body.radius_km ?? null,
      search_scope,
      target_offer: body.target_offer ?? null,
      desired_count,
      quality_focus: body.quality_focus ?? null,
      status: 'queued',
    })
    .select()
    .single()

  if (insErr || !scan) {
    return NextResponse.json({ error: 'insert_failed', detail: insErr?.message }, { status: 500 })
  }

  // 4. n8n-Webhook triggern (wenn konfiguriert). Sonst Preview-Modus.
  const webhookUrl = process.env.N8N_RADAR_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({
      scan_id: scan.id,
      status: 'queued',
      preview: true,
      message: 'N8N_RADAR_WEBHOOK_URL nicht gesetzt — Scan vorgemerkt, aber nicht ausgelöst.',
    })
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.N8N_RADAR_WEBHOOK_SECRET
          ? { 'x-radar-secret': process.env.N8N_RADAR_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        scan_id: scan.id,
        region,
        radius_km: scan.radius_km,
        search_scope,
        target_offer: scan.target_offer,
        desired_count,
        quality_focus: scan.quality_focus,
      }),
    })
    if (!res.ok) throw new Error(`n8n responded ${res.status}`)

    await sb.from('radar_scans')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', scan.id)

    return NextResponse.json({ scan_id: scan.id, status: 'running' })
  } catch (e: any) {
    await sb.from('radar_scans')
      .update({ status: 'failed', error: e?.message || String(e) })
      .eq('id', scan.id)
    return NextResponse.json(
      { scan_id: scan.id, status: 'failed', error: e?.message || String(e) },
      { status: 502 },
    )
  }
}
