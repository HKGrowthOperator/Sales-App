import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Profile, Lead, Appointment, Followup, Script } from '@/lib/types'
import { OpenerDashboard } from '@/components/dashboard/OpenerDashboard'
import { SetterDashboard } from '@/components/dashboard/SetterDashboard'
import { CloserDashboard } from '@/components/dashboard/CloserDashboard'
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_PUBLIC_COLUMNS)
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const today = new Date()
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  let leads: Lead[] = []
  let appointments: Appointment[] = []
  let followups: Followup[] = []
  let scripts: Script[] = []

  if (profile.role === 'opener') {
    const { data: scriptData } = await supabase
      .from('scripts')
      .select('*')
      .eq('role', 'Opener')
      .eq('is_active', true)
    scripts = scriptData || []
  }

  if (profile.role === 'opener') {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('do_not_contact', false)
      .in('status', ['Neu', 'Zu kontaktieren', 'Nicht erreicht', 'Kontaktiert'])
      .order('created_at', { ascending: false })
      .limit(20)
    leads = data || []
  } else if (profile.role === 'setter') {
    const { data } = await supabase
      .from('leads')
      .select('*, call_notes(*)')
      .eq('do_not_contact', false)
      .in('status', ['Interessiert', 'Setter-Call geplant', 'Setter qualifiziert'])
      .order('updated_at', { ascending: false })
      .limit(20)
    leads = data || []

    const { data: appts } = await supabase
      .from('appointments')
      .select('*, lead:leads(*)')
      .eq('appointment_type', 'Setter-Call')
      .eq('assigned_user_id', user.id)
      .in('status', ['Geplant', 'Bestätigt'])
      .gte('appointment_at', todayStart)
      .lte('appointment_at', todayEnd)
    appointments = appts || []
  } else if (profile.role === 'closer' || profile.role === 'admin') {
    const { data } = await supabase
      .from('leads')
      .select('*, call_notes(*)')
      .eq('do_not_contact', false)
      .in('status', ['Closer-Call geplant', 'Angebot vorbereiten', 'Angebot gesendet', 'Follow-up'])
      .order('appointment_at', { ascending: true })
      .limit(20)
    leads = data || []

    let apptQuery = supabase
      .from('appointments')
      .select('*, lead:leads(*)')
      .eq('appointment_type', 'Closer-Call')
      .in('status', ['Geplant', 'Bestätigt'])
      .gte('appointment_at', todayStart)
      .lte('appointment_at', todayEnd)
      .order('appointment_at', { ascending: true })
    if (profile.role === 'closer') apptQuery = apptQuery.eq('assigned_user_id', user.id)
    const { data: appts } = await apptQuery
    appointments = appts || []
  }

  let fupQuery = supabase
    .from('followups')
    .select('*, lead:leads(company_name, contact_name)')
    .eq('status', 'offen')
    .lte('due_at', todayEnd)
    .order('due_at', { ascending: true })
    .limit(10)
  if (profile.role !== 'admin') fupQuery = fupQuery.eq('assigned_to', user.id)
  const { data: fups } = await fupQuery
  followups = fups || []

  if (profile.role === 'opener') {
    return <OpenerDashboard profile={profile as Profile} leads={leads} followups={followups} scripts={scripts} />
  }
  if (profile.role === 'setter') {
    return <SetterDashboard profile={profile as Profile} leads={leads} appointments={appointments} followups={followups} />
  }
  return <CloserDashboard profile={profile as Profile} leads={leads} appointments={appointments} followups={followups} />
}
