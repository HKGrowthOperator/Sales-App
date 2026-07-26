import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rateLimit'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { researchEnabled, researchCompany } from '@/lib/radar/research'
import { enrichFromWebsite, discoverWebsite } from '@/lib/radar/enrich'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ============================================================
// POST /api/leads/research — Research für einen BESTEHENDEN Lead
// ------------------------------------------------------------
// Verkaufs-Vorbereitung auf Knopfdruck (Lead-Detailseite): prüft
// Website/Social, sucht Entscheider + Kontakt, formuliert Pain,
// Opener-Pitch und Automatisierungspotenzial neu.
//   MIT Keys (BRAVE_API_KEY + ANTHROPIC_API_KEY): voller Research-Agent.
//   OHNE Keys: free Pfad (Website-Fetch + Domain-Discovery).
// Vorhandene Felder werden nur GEFÜLLT, nie überschrieben — außer
// Research-Feldern (pain/pitch/automation), die aktualisiert werden.
// Body: { lead_id: string }
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Research ruft ein Sprachmodell auf — hier wird Geld ausgegeben.
  const rl = rateLimit(`research:${user.id}`, 30, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', detail: `Zu viele Research-Anfragen. In ${rl.retryAfterSeconds} Sekunden erneut versuchen.` },
      { status: 429, headers: { 'retry-after': String(rl.retryAfterSeconds) } },
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const leadId = typeof body?.lead_id === 'string' ? body.lead_id : null
  if (!leadId) {
    return NextResponse.json({ error: 'lead_id fehlt' }, { status: 400 })
  }

  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: lead, error: leadErr } = await svc
    .from('leads')
    .select('id, company_name, contact_name, role_title, phone, email, website, instagram, industry, pain_guess, opener_pitch, automation_potential, relevance_reason')
    .eq('id', leadId)
    .single()
  if (leadErr || !lead) {
    return NextResponse.json({ error: 'lead_not_found' }, { status: 404 })
  }

  const update: Record<string, unknown> = {}
  const found: string[] = []
  let mode: 'agent' | 'free' = 'free'

  if (researchEnabled()) {
    mode = 'agent'
    const r = await researchCompany({
      company_name: lead.company_name,
      city: null,
      industry: lead.industry,
      website: lead.website,
      phone: lead.phone,
    })
    if (!r) {
      return NextResponse.json({ ok: false, error: 'research_failed', detail: 'Research-Agent hat kein Ergebnis geliefert.' }, { status: 502 })
    }
    if (r.website_url && !lead.website) { update.website = r.website_url; found.push('Website') }
    if (r.decision_maker_name && !lead.contact_name) { update.contact_name = r.decision_maker_name; found.push('Ansprechpartner') }
    if (r.decision_maker_role && !lead.role_title) update.role_title = r.decision_maker_role
    if (r.phone && !lead.phone) { update.phone = r.phone; found.push('Telefon') }
    if (r.email && !lead.email) { update.email = r.email; found.push('E-Mail') }
    if (r.social_url && !lead.instagram) { update.instagram = r.social_url; found.push('Social Media') }
    // Research-Felder werden AKTUALISIERT (das ist der Zweck des Refreshs)
    if (r.pain_summary) { update.pain_guess = r.pain_summary; found.push('Pain') }
    if (r.opener_pitch) { update.opener_pitch = r.opener_pitch; found.push('Opener-Pitch') }
    if (r.automation_potential) { update.automation_potential = r.automation_potential; found.push('Automatisierungspotenzial') }
    if (r.notes && !lead.relevance_reason) update.relevance_reason = r.notes
  } else {
    // FREE-Pfad: Website finden/lesen, Kontaktdaten + Schwächen extrahieren.
    let site = lead.website as string | null
    if (!site) {
      site = await discoverWebsite(lead.company_name, null, 6000)
      if (site) { update.website = site; found.push('Website') }
    }
    if (site) {
      const e = await enrichFromWebsite(site.includes('://') ? site : `https://${site}`, 8000)
      if (e) {
        if (e.found_phone && !lead.phone) { update.phone = e.found_phone; found.push('Telefon') }
        if (e.found_email && !lead.email) { update.email = e.found_email; found.push('E-Mail') }
        const social = e.found_instagram || e.found_facebook || e.found_linkedin
        if (social && !lead.instagram) { update.instagram = social; found.push('Social Media') }
        if (e.weaknesses.length && !lead.pain_guess) {
          update.pain_guess = `Website-Schwächen: ${e.weaknesses.join(', ')}`
          found.push('Pain')
        }
      }
    }
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ ok: true, mode, updated: [], message: 'Nichts Neues gefunden — Lead ist bereits vollständig recherchiert.' })
  }

  // "Enrichment nötig"-Marker neu berechnen
  const after = { ...lead, ...update }
  const missing: string[] = []
  if (!after.phone && !after.email) missing.push('Kontakt (Telefon/E-Mail)')
  if (!after.pain_guess) missing.push('Pain/Aufhänger')
  if (!after.opener_pitch) missing.push('Opener-Pitch')
  update.next_step = missing.length ? `⚠️ Enrichment nötig: ${missing.join(', ')}` : null
  update.updated_at = new Date().toISOString()

  const { error: updErr } = await svc.from('leads').update(update).eq('id', leadId)
  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, mode, updated: found, still_missing: missing })
}
