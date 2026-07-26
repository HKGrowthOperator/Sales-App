import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Profile } from '@/lib/types'
import { AvailabilityEditor } from '@/components/admin/AvailabilityEditor'
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns'

export default async function AdminAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; google_error?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select(PROFILE_PUBLIC_COLUMNS).eq('id', user.id).single()
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
      currentUserId={user.id}
      googleMessage={sp?.google || null}
      googleError={sp?.google_error || null}
    />
  )
}
