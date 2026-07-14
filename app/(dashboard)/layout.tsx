import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/shared/Navbar'
import { Profile } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={profile as Profile} />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
