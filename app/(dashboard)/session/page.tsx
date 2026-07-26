import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Profile, Lead, CallSession, RoleContext } from '@/lib/types'
import { SessionClient } from '@/components/session/SessionClient'
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns'

// Status-Queues je Rolle
const QUEUE_STATUSES: Record<RoleContext, string[]> = {
  Opener: ['Neu', 'Zu kontaktieren', 'Nicht erreicht', 'Kontaktiert', 'Follow-up', 'Später erneut kontaktieren'],
  Setter: ['Interessiert', 'Setter-Call geplant', 'Follow-up'],
  Closer: ['Closer-Call geplant', 'Angebot vorbereiten', 'Angebot gesendet', 'Follow-up'],
}

export default async function SessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select(PROFILE_PUBLIC_COLUMNS).eq('id', user.id).single()
  if (!profile) redirect('/login')

  const roleLabel: RoleContext = profile.role === 'setter' ? 'Setter'
    : profile.role === 'closer' ? 'Closer' : 'Opener'

  // Aktive Session?
  const { data: session } = await supabase
    .from('call_sessions').select('*')
    .eq('user_id', user.id).eq('status', 'aktiv')
    .order('started_at', { ascending: false })
    .limit(1).maybeSingle()

  let sessionLeads: any[] = []
  let candidates: Lead[] = []

  if (session) {
    const { data } = await supabase
      .from('session_leads')
      .select('*, lead:leads(*)')
      .eq('session_id', session.id)
      .order('position', { ascending: true })
    sessionLeads = data || []
  } else {
    const { data } = await supabase
      .from('leads').select('*')
      .eq('do_not_contact', false)
      .in('status', QUEUE_STATUSES[roleLabel])
      .order('lead_score', { ascending: true, nullsFirst: false })
      .order('followup_at', { ascending: true, nullsFirst: false })
      .order('last_contact_at', { ascending: true, nullsFirst: true })
      .limit(50)
    candidates = (data || []) as Lead[]
  }

  return (
    <SessionClient
      profile={profile as Profile}
      roleLabel={roleLabel}
      session={(session as CallSession) || null}
      sessionLeads={sessionLeads}
      candidates={candidates}
    />
  )
}
