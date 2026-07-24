import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamManager } from '@/components/admin/TeamManager'
import { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true })

  return <TeamManager me={profile as Profile} initialProfiles={(profiles || []) as Profile[]} />
}
