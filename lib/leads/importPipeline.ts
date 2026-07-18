import { createClient as createServiceClient } from '@supabase/supabase-js'
import { IngestLead, mapIngestToRadarTarget } from '@/lib/radar/ingestContract'
import { enrichBatch, enrichFromWebsite, discoverWebsite } from '@/lib/radar/enrich'
import { classifyFit } from '@/lib/radar/exclude'
import { researchEnabled, researchBatch } from '@/lib/radar/research'
import { toLeadContract, isLeadQualified } from '@/lib/radar/leadContract.mjs'
import { sendLead } from '@/lib/radar/sendLead.mjs'

// ============================================================
// Gemeinsame Lead-Import-Pipeline — genutzt vom Radar-Ingest
// (POST /api/leads/ingest) UND vom In-App-Upload
// (POST /api/leads/upload, CSV/Tabelle/Google Sheet).
// ------------------------------------------------------------
// Ablauf je Lead:
//   1. Mappen + validieren (company_name + dedup_key Pflicht).
//   2. No-Fit-Filter (Ketten, Behörden, Schulen, Vereine).
//   3. RESEARCH-Schicht: mit API-Keys echter Research-Agent
//      (Websuche + LLM-Verifikation), sonst free Pfad
//      (Website-Fetch + Domain-Discovery). Best-effort.
//   4. Read-Back gegen v_radar_lead_state (Opt-out / schon Lead).
//   5. radar_targets upserten + AUTO-PROMOTE in den Opener-Pool.
// ============================================================

export interface ImportOptions {
  /** leads.lead_source der erzeugten Leads (z.B. 'Lead Radar', 'Tabellen-Import') */
  leadSource: string
  /** radar_targets.scan_source ('ingest' | 'upload') */
  scanSource: string
  /** Optional: alle erzeugten Leads dieser Person zuweisen */
  assignedTo?: string | null
  /** Lead-Contract-Übergabe (RADAR_EMIT_CONTRACT) — nur Radar-Ingest */
  emitContract?: boolean
}

export type LeadResult = {
  dedup_key: string | null
  company_name: string | null
  status: 'created' | 'updated' | 'skipped' | 'rejected'
  reason?: string
  target_id?: string
  lead_status?: string
  lead?: 'created' | 'created_needs_enrichment' | 'linked' | 'lead_failed'
  lead_id?: string
  missing?: string[]
  lead_error?: string
}

// Pflicht-Infos, die ein Opener für einen brauchbaren Lead braucht.
// Fehlt etwas → Lead kommt TROTZDEM an, wird aber als enrichment-bedürftig markiert.
function missingForOpener(row: Record<string, unknown>): string[] {
  const m: string[] = []
  if (!row.phone && !row.email) m.push('Kontakt (Telefon/E-Mail)')
  if (!row.pain_summary && !row.detected_weakness) m.push('Pain/Aufhänger')
  if (!row.opener_pitch) m.push('Opener-Pitch')
  return m
}

// Baut aus der radar_targets-Zeile den operativen Lead (Opener-Pool).
// Spiegelt das Mapping aus promote_radar_target(), aber service-role-seitig
// (Auto-Promote: Übergabe landet sofort bei den Openern).
function leadFromRow(
  row: Record<string, unknown>,
  targetId: string,
  key: string,
  opts: ImportOptions,
) {
  const areas = (row.product_areas as string[]) || []
  const area = areas[0]
  const entry_angle =
    area === 'Website' ? 'Website'
    : area === 'Social Media' ? 'Social Media'
    : area === 'KI-Integration' ? 'KI-Zeitersparnis'
    : null
  const missing = missingForOpener(row)
  const lead = {
    company_name: row.company_name,
    contact_name: row.decision_maker_name ?? null,
    role_title: row.decision_maker_role ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    website: row.website ?? null,
    instagram: row.social_url ?? null,
    industry: row.industry ?? null,
    lead_source: opts.leadSource,
    lead_score: row.overall_score ?? null,
    entry_angle,
    pain_guess: row.pain_summary ?? null,
    relevance_reason: (row.detected_weakness as string) ?? (row.opener_pitch as string) ?? null,
    recommended_module_keys: (row.recommended_module_keys as string[]) ?? [],
    opener_pitch: row.opener_pitch ?? null,
    setter_context: row.setter_context ?? null,
    closer_context: row.closer_context ?? null,
    automation_potential: row.automation_potential ?? null,
    status: 'Zu kontaktieren',
    next_step: missing.length ? `⚠️ Enrichment nötig: ${missing.join(', ')}` : null,
    radar_target_id: targetId,
    dedup_key: key,
    ...(opts.assignedTo ? { assigned_to: opts.assignedTo } : {}),
  }
  return { lead, missing }
}

export async function runLeadImportPipeline(
  leads: IngestLead[],
  opts: ImportOptions,
): Promise<{ results: LeadResult[]; summary: Record<string, number> }> {
  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // 1. Mappen
  const results: LeadResult[] = []
  const mapped: { key: string; row: Record<string, unknown>; idx: number; excluded?: string }[] = []
  leads.forEach((lead, idx) => {
    const m = mapIngestToRadarTarget(lead)
    if (!m.ok || !m.row || !m.dedup_key) {
      results[idx] = {
        dedup_key: null,
        company_name: lead?.company_name ?? null,
        status: 'rejected',
        reason: m.reason || 'invalid',
      }
    } else {
      m.row.scan_source = opts.scanSource
      // No-Fit-Filter: Ketten/Filialen, Behörden, Schulen, Vereine raus.
      const fit = classifyFit(m.row.company_name as string)
      if (fit.kind !== 'ok') {
        results[idx] = {
          dedup_key: m.dedup_key,
          company_name: m.row.company_name as string,
          status: 'skipped',
          reason: `excluded_${fit.kind}: ${fit.reason}`,
        }
        return
      }
      mapped.push({ key: m.dedup_key, row: m.row, idx })
    }
  })

  const keys = Array.from(new Set(mapped.map((m) => m.key)))

  // 1b. RESEARCH-SCHICHT — verifizierte Einordnung VOR dem Einfügen.
  //   MIT Keys (BRAVE_API_KEY + ANTHROPIC_API_KEY): echter Research-Agent
  //     (Websuche → Seite lesen → LLM verifiziert) überschreibt Vermutungen
  //     mit Fakten (Website ja/nein, Qualität, Kette?, Entscheider, Pain, …).
  //   OHNE Keys: free Pfad (Website-Fetch der gegebenen + Domain-Discovery der
  //     fehlenden). Best-effort, bricht den Import nie.
  for (const m of mapped) m.row.website_present = !!m.row.website
  let websiteCorrected = 0
  let researched = 0

  if (researchEnabled()) {
    try {
      researched = await researchBatch(
        mapped,
        (m) => ({
          company_name: m.row.company_name as string,
          city: (m.row.city as string) || null,
          industry: (m.row.industry as string) || null,
          website: (m.row.website as string) || null,
          phone: (m.row.phone as string) || null,
        }),
        (m, r) => {
          if (!r) return
          if (r.is_chain) { m.excluded = `excluded_chain_llm: ${r.chain_reason || 'Kette/No-Fit'}`; return }
          if (r.has_website && r.website_url) {
            if (!m.row.website) websiteCorrected++
            m.row.website = r.website_url
            m.row.website_present = true
            if (r.website_quality != null) m.row.website_score = r.website_quality
          } else if (r.has_website === false) {
            m.row.website_present = false
          }
          if (r.decision_maker_name) m.row.decision_maker_name = r.decision_maker_name
          if (r.decision_maker_role) m.row.decision_maker_role = r.decision_maker_role
          if (r.phone && !m.row.phone) m.row.phone = r.phone
          if (r.email && !m.row.email) m.row.email = r.email
          if (r.social_url && !m.row.social_url) m.row.social_url = r.social_url
          if (r.pain_summary) m.row.pain_summary = r.pain_summary
          if (r.opener_pitch) m.row.opener_pitch = r.opener_pitch
          if (r.automation_potential) m.row.automation_potential = r.automation_potential
          if (Array.isArray(r.product_areas) && r.product_areas.length) m.row.product_areas = r.product_areas
          if (r.recommended_offer) m.row.recommended_offer = r.recommended_offer
          if (r.overall) m.row.overall_score = r.overall
          if (r.confidence != null) m.row.confidence = r.confidence
          if (r.notes) m.row.website_analysis = r.notes
        },
        { concurrency: 4, max: 25 },
      )
    } catch { /* Research darf den Import nie brechen */ }
  } else {
    // FREE-Pfad: Website-Fetch (gegebene Seiten) + Domain-Discovery (fehlende).
    try {
      await enrichBatch(
        mapped,
        (m) => (m.row.website as string) || null,
        (m, e) => {
          const row = m.row
          if (!e) return
          row.website_present = true
          row.website_score = e.website_score
          row.website_analysis = e.notes
          if (!row.phone && e.found_phone) row.phone = e.found_phone
          if (!row.email && e.found_email) row.email = e.found_email
          if (!row.social_url && (e.found_instagram || e.found_facebook || e.found_linkedin))
            row.social_url = e.found_instagram || e.found_facebook || e.found_linkedin
          const merged = [(row.detected_weakness as string) || '', ...e.weaknesses].filter(Boolean).join(', ')
          row.detected_weakness = merged || null
        },
        { concurrency: 6, timeoutMs: 5000, max: 30 },
      )
    } catch { /* nie brechen */ }

    const noSite = mapped.filter((m) => !m.row.website).slice(0, 30)
    await Promise.all(
      noSite.map(async (m) => {
        try {
          const found = await discoverWebsite(m.row.company_name as string, (m.row.city as string) || null, 4500)
          if (!found) return
          websiteCorrected++
          m.row.website = found
          m.row.website_present = true
          const weak = ((m.row.detected_weakness as string) || '')
            .split(',').map((s) => s.trim()).filter((s) => s && !/keine website/i.test(s))
          const e = await enrichFromWebsite(found, 5000)
          if (e) {
            m.row.website_score = e.website_score
            m.row.website_analysis = `Website DOCH gefunden (${found}) — "keine Website" war falsch (OSM-Lücke). ` + e.notes
            if (!m.row.phone && e.found_phone) m.row.phone = e.found_phone
            if (!m.row.email && e.found_email) m.row.email = e.found_email
            weak.push(...e.weaknesses)
          } else {
            m.row.website_analysis = `Website DOCH gefunden (${found}) — "keine Website" war falsch.`
          }
          m.row.detected_weakness = weak.length ? Array.from(new Set(weak)).join(', ') : null
          const pa = ((m.row.product_areas as string[]) || []).filter((a) => a !== 'Website')
          m.row.product_areas = pa
          m.row.recommended_offer = pa[0] || 'HK Wachstums-Check'
          m.row.overall_score = 'C' // Website-Premisse hinfällig → deprioritisieren
        } catch { /* Discovery darf den Import nie brechen */ }
      }),
    )
  }

  // 2. Read-Back (CRM-Status) + bestehende Targets in je 1 Query
  const [{ data: states }, { data: targets }] = await Promise.all([
    svc.from('v_radar_lead_state').select('dedup_key,status,do_not_contact').in('dedup_key', keys),
    svc.from('radar_targets').select('id,status,dedup_key').in('dedup_key', keys),
  ])
  const stateByKey = new Map((states || []).map((s: any) => [s.dedup_key, s]))
  const targetByKey = new Map((targets || []).map((t: any) => [t.dedup_key, t]))

  // 3. Pro Lead entscheiden + schreiben
  const seen = new Set<string>()
  for (const m of mapped) {
    const { key, row, idx } = m
    const base = { dedup_key: key, company_name: row.company_name as string }

    if (m.excluded) { results[idx] = { ...base, status: 'skipped', reason: m.excluded }; continue }

    if (seen.has(key)) {
      results[idx] = { ...base, status: 'skipped', reason: 'duplicate_in_batch' }
      continue
    }
    seen.add(key)

    const st = stateByKey.get(key)
    if (st) {
      results[idx] = {
        ...base,
        status: 'skipped',
        reason: st.do_not_contact ? 'opt_out' : 'already_in_sales',
        lead_status: st.status,
      }
      continue
    }

    const existing = targetByKey.get(key)
    if (existing && ['promoted', 'dismissed', 'duplicate'].includes(existing.status)) {
      results[idx] = { ...base, status: 'skipped', reason: `target_${existing.status}` }
      continue
    }

    // a) Staging-Target upserten
    let targetId: string | undefined
    if (existing) {
      const { error } = await svc.from('radar_targets').update(row).eq('id', existing.id)
      if (error) { results[idx] = { ...base, status: 'rejected', reason: error.message }; continue }
      targetId = existing.id
      results[idx] = { ...base, status: 'updated', target_id: targetId }
    } else {
      const { data, error } = await svc.from('radar_targets').insert(row).select('id').single()
      if (error) { results[idx] = { ...base, status: 'rejected', reason: error.message }; continue }
      targetId = data?.id
      results[idx] = { ...base, status: 'created', target_id: targetId }
    }

    // b) AUTO-PROMOTE → Lead direkt in den Opener-Pool (status 'Zu kontaktieren').
    //    Kommt IMMER an; fehlt Pflicht-Info, wird der Lead als enrichment-bedürftig
    //    markiert (next_step), aber nicht blockiert.
    const { lead, missing } = leadFromRow(row, targetId as string, key, opts)
    const { data: leadRow, error: leadErr } = await svc.from('leads').insert(lead).select('id').single()
    if (leadErr) {
      results[idx].lead = 'lead_failed'
      results[idx].lead_error = leadErr.message
    } else {
      await svc.from('radar_targets')
        .update({ status: 'promoted', promoted_lead_id: leadRow!.id })
        .eq('id', targetId)
      results[idx].lead_id = leadRow!.id
      results[idx].lead = missing.length ? 'created_needs_enrichment' : 'created'
      if (missing.length) results[idx].missing = missing
    }
  }

  // 4. ENTKOPPELTE Lead-Contract-Übergabe (opt-in, best-effort).
  // Nur wenn RADAR_EMIT_CONTRACT=1 UND emitContract: für frisch angelegte/
  // aktualisierte und qualifizierte Leads den Lead-Contract bauen und via
  // sendLead() ausgeben. Fire-and-forget: darf den Import NIE brechen.
  if (opts.emitContract && process.env.RADAR_EMIT_CONTRACT === '1') {
    await Promise.allSettled(
      mapped
        .filter((m) => ['created', 'updated'].includes(results[m.idx]?.status))
        .map((m) => {
          const contract = toLeadContract(leads[m.idx])
          return isLeadQualified(contract) ? sendLead(contract) : Promise.resolve()
        }),
    ).catch(() => {})
  }

  const summary = results.reduce(
    (acc, r) => {
      if (!r) return acc
      acc[r.status] = (acc[r.status] || 0) + 1
      if (r.lead === 'created' || r.lead === 'created_needs_enrichment') acc.leads_created++
      if (r.lead === 'created_needs_enrichment') acc.needs_enrichment++
      return acc
    },
    { created: 0, updated: 0, skipped: 0, rejected: 0, leads_created: 0, needs_enrichment: 0 } as Record<string, number>,
  )
  summary.website_corrected = websiteCorrected
  summary.researched = researched

  return { results, summary }
}
