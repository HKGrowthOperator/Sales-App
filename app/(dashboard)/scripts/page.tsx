import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Script, Profile } from '@/lib/types'
import { ScriptsClient } from '@/components/scripts/ScriptsClient'
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns'

export default async function ScriptsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select(PROFILE_PUBLIC_COLUMNS).eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Master-Skripte (alle approved) — Rolle des Users zuerst, Admin sieht alle
  const { data: masters } = await supabase
    .from('scripts')
    .select('*')
    .eq('script_type', 'master')
    .eq('status', 'approved')
    .order('role')
    .order('title')

  // Eigene persönliche Versionen
  const { data: personal } = await supabase
    .from('scripts')
    .select('*')
    .eq('script_type', 'personal')
    .eq('owner_user_id', user.id)
    .order('updated_at', { ascending: false })

  // Admin: alle persönlichen Versionen in Prüfung
  let pending: any[] = []
  if (profile.role === 'admin') {
    const { data } = await supabase
      .from('scripts')
      .select('*, owner:profiles!scripts_owner_user_id_fkey(full_name)')
      .eq('script_type', 'personal')
      .eq('status', 'pending_review')
      .order('updated_at', { ascending: false })
    pending = data || []
  }

  // Mitarbeiter sehen nur Master ihrer eigenen Rolle; Admin alle
  const roleLabel = profile.role === 'opener' ? 'Opener'
    : profile.role === 'setter' ? 'Setter'
    : profile.role === 'closer' ? 'Closer' : null
  const masterScripts = ((masters || []) as Script[]).filter(
    m => profile.role === 'admin' || m.role === roleLabel
  )

  return (
    <ScriptsClient
      profile={profile as Profile}
      masterScripts={masterScripts}
      personalScripts={(personal || []) as Script[]}
      pendingScripts={pending}
    />
  )
}
