import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadsListClient } from '@/components/leads/LeadsListClient'
import { Profile } from '@/lib/types'
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns'

export default async function LeadsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select(PROFILE_PUBLIC_COLUMNS).eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .order('updated_at', { ascending: false })

  return (
    <LeadsListClient
      profile={profile as Profile}
      initialLeads={leads || []}
    />
  )
}
