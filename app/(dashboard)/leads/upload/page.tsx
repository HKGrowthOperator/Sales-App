import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LeadUploadClient } from '@/components/leads/LeadUploadClient'
import { Profile } from '@/lib/types'

export default async function LeadUploadPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role, email')

  return (
    <LeadUploadClient profile={profile as Profile} allProfiles={profiles || []} />
  )
}
