import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContentManager } from '@/components/admin/ContentManager'
import { Script, ObjectionItem } from '@/lib/types'
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns'

export const dynamic = 'force-dynamic'

export default async function AdminScriptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select(PROFILE_PUBLIC_COLUMNS).eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const [{ data: scripts }, { data: objections }] = await Promise.all([
    supabase.from('scripts').select('*').eq('script_type', 'master').order('role').order('title'),
    supabase.from('objection_library').select('*').order('role').order('sort_order'),
  ])

  return (
    <ContentManager
      initialScripts={(scripts || []) as Script[]}
      initialObjections={(objections || []) as ObjectionItem[]}
    />
  )
}
