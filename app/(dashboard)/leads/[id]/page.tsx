import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import { LeadDetailClient } from '@/components/leads/LeadDetailClient'
import { Profile, Lead, Script } from '@/lib/types'
import { deriveLeadNextAction } from '@/lib/leads/nextAction'
import { buildLeadTimeline } from '@/lib/leads/timeline'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: lead } = await supabase
    .from('leads')
    .select(`
      *,
      call_notes(*, user:profiles(full_name, role)),
      appointments(*)
    `)
    .eq('id', id)
    .single()

  if (!lead) notFound()

  const roleLabel = profile.role === 'opener' ? 'Opener'
    : profile.role === 'setter' ? 'Setter'
    : 'Closer'

  // ─── Script Matching (Priorität: persönlich approved > master mit entry_angle > master ohne) ─
  let script: Script | null = null

  // 1. Persönliche approved Version des Users (Phase 5 füllt das mit Leben)
  const { data: personalScript } = await supabase
    .from('scripts')
    .select('*')
    .eq('script_type', 'personal')
    .eq('owner_user_id', user.id)
    .eq('role', roleLabel)
    .eq('status', 'approved')
    .eq('entry_angle', lead.entry_angle || '')
    .limit(1)
    .maybeSingle()

  if (personalScript) {
    script = personalScript as Script
  }

  // 2. Master-Script: role + entry_angle
  if (!script && lead.entry_angle) {
    const { data: s } = await supabase
      .from('scripts')
      .select('*')
      .eq('script_type', 'master')
      .eq('role', roleLabel)
      .eq('entry_angle', lead.entry_angle)
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle()
    script = s as Script | null
  }

  // 3. Fallback: bestes Master-Script für die Rolle
  if (!script) {
    const { data: s } = await supabase
      .from('scripts')
      .select('*')
      .eq('script_type', 'master')
      .eq('role', roleLabel)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    script = s as Script | null
  }

  // 4. Legacy-Fallback: is_active (für alte Scripts vor Migration)
  if (!script) {
    const { data: s } = await supabase
      .from('scripts')
      .select('*')
      .eq('role', roleLabel)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    script = s as Script | null
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, email')

  // ─── Einwand-Library (rollen- + winkelgefiltert) ─────────────────────────────
  const { data: objectionsRaw } = await supabase
    .from('objection_library')
    .select('*')
    .eq('is_active', true)
    .or(`role.is.null,role.eq.${roleLabel}`)
    .order('sort_order', { ascending: true })

  const objections = (objectionsRaw || []).filter(
    (o: any) => o.entry_angle == null || o.entry_angle === lead.entry_angle
  )

  // ─── Dossier-Daten: Termine (mit Zuständigem), Follow-ups, Mails, Reminder, Automation ───
  const [apptRes, fupRes, mailRes, remRes, logRes] = await Promise.all([
    supabase.from('appointments').select('*, assigned:profiles!appointments_assigned_user_id_fkey(full_name)').eq('lead_id', id).order('appointment_at', { ascending: false }),
    supabase.from('followups').select('*').eq('lead_id', id).order('due_at', { ascending: false }),
    supabase.from('email_jobs').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
    supabase.from('reminder_jobs').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
    supabase.from('automation_logs').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
  ])
  const appointments = (apptRes.data || []).map((a: any) => ({ ...a, assigned_name: a.assigned?.full_name ?? null }))
  const followups = fupRes.data || []
  const mails = mailRes.data || []
  const reminders = remRes.data || []
  const automationLogs = logRes.data || []

  const nextAction = deriveLeadNextAction({ lead, appointments, followups })
  const timeline = buildLeadTimeline({
    lead, callNotes: lead.call_notes || [], appointments, followups,
    emailJobs: mails, reminderJobs: reminders, automationLogs,
  })

  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Laden…</div>}>
      <LeadDetailClient
        lead={lead as Lead}
        profile={profile as Profile}
        script={script}
        objections={objections}
        allProfiles={profiles || []}
        nextAction={nextAction}
        timeline={timeline}
        dossierAppointments={appointments}
        followups={followups}
        mails={mails}
        automationLogs={automationLogs}
      />
    </Suspense>
  )
}
