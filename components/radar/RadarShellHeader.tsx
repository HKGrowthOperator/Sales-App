'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { LogOut, LayoutGrid, Radar as RadarIcon } from 'lucide-react'

// Zurück-zur-Zentrale-Ziel (HK Control Center). Über NEXT_PUBLIC_ZENTRALE_URL
// überschreibbar; Default = öffentlicher Control-Center-Funnel.
const ZENTRALE_URL =
  process.env.NEXT_PUBLIC_ZENTRALE_URL || 'https://hkgrowth.tail0398a8.ts.net:8443'

export function RadarShellHeader({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [out, setOut] = useState(false)

  async function signOut() {
    setOut(true)
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600 text-white">
          <RadarIcon className="h-4 w-4" />
        </div>
        <span className="font-semibold text-slate-900">Lead Radar</span>
      </div>

      <a
        href={ZENTRALE_URL}
        className="ml-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        title="Zurück zur Zentrale"
      >
        <LayoutGrid className="h-4 w-4" /> Zentrale
      </a>

      <div className="flex-1" />

      <span className="hidden text-sm text-slate-600 sm:block">
        {profile.full_name || profile.email}
      </span>
      <button
        onClick={signOut}
        disabled={out}
        title="Abmelden"
        aria-label="Abmelden"
        className="text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </header>
  )
}
