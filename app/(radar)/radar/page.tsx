import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RadarClient } from '@/components/radar/RadarClient'
import { Profile, RadarTarget, RadarLeadState } from '@/lib/types'

export default async function RadarPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Radar ist ein Admin-Werkzeug (Nick/Luis). RLS gated zusätzlich serverseitig.
  if (profile.role !== 'admin') redirect('/dashboard')

  const { data: targets } = await supabase
    .from('radar_targets')
    .select('*')
    .order('scanned_at', { ascending: false, nullsFirst: false })

  const targetList = (targets as RadarTarget[]) || []

  // Read-Back: CRM-Stand je dedup_key (schon Lead? Opt-out? Termin? Kunde?),
  // damit der Radar nicht doppelt vorschlägt. Match über dedup_key.
  const dedupKeys = Array.from(
    new Set(targetList.map((t) => t.dedup_key).filter((k): k is string => Boolean(k))),
  )
  let leadStates: Record<string, RadarLeadState> = {}
  if (dedupKeys.length) {
    const { data: states } = await supabase
      .from('v_radar_lead_state')
      .select('*')
      .in('dedup_key', dedupKeys)
    leadStates = Object.fromEntries(
      ((states as RadarLeadState[]) || []).map((s) => [s.dedup_key, s]),
    )
  }

  return (
    <RadarClient
      profile={profile as Profile}
      initialTargets={targetList}
      leadStates={leadStates}
    />
  )
}
