import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppointmentsClient } from '@/components/appointments/AppointmentsClient'
import { Profile } from '@/lib/types'

export default async function AppointmentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      lead:leads(company_name, contact_name, phone, email, entry_angle, lead_score),
      closer_profile:profiles!appointments_closer_fkey(full_name)
    `)
    .order('appointment_at', { ascending: true })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, email')
    .in('role', ['closer', 'admin'])

  return (
    <AppointmentsClient
      profile={profile as Profile}
      initialAppointments={appointments || []}
      closers={profiles || []}
    />
  )
}
