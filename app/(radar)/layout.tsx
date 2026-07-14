import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RadarShellHeader } from '@/components/radar/RadarShellHeader'
import { Profile } from '@/lib/types'

// Eigenes App-Layout für den Lead Radar — bewusst OHNE die Sales-Cockpit-
// Navigation. Wird aus der Zentrale (HK Control Center) als eigenes Werkzeug
// gestartet und fühlt sich dadurch wie eine eigene App an, nutzt aber Login,
// Datenbank und Berechtigungen der Sales-App mit.
export default async function RadarLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Radar ist ein Admin-Werkzeug (Nick/Luis).
  if (profile.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      <RadarShellHeader profile={profile as Profile} />
      <main className="pt-16">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">{children}</div>
      </main>
    </div>
  )
}
