import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Profile } from '@/lib/types'
import { AvailabilityEditor } from '@/components/admin/AvailabilityEditor'

export default async function AdminAvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, default_call_link, google_calendar_id, google_oauth_connected, google_overridable_blocks')
    .order('role', { ascending: true })

  const { data: rules } = await supabase.from('availability_rules').select('*')

  const today = new Date().toISOString().slice(0, 10)
  const { data: exceptions } = await supabase
    .from('availability_exceptions').select('*')
    .gte('date', today).eq('is_active', true).order('date')

  return (
    <AvailabilityEditor
      profiles={(profiles || []) as any}
      rules={(rules || []) as any}
      exceptions={(exceptions || []) as any}
    />
  )
}
