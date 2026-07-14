import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewLeadForm } from '@/components/leads/NewLeadForm'
import { Profile } from '@/lib/types'

export default async function NewLeadPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role, email')

  return (
    <div className="max-w-2xl">
      <NewLeadForm profile={profile as Profile} allProfiles={profiles || []} />
    </div>
  )
}
