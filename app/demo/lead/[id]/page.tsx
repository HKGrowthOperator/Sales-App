import { MOCK_LEADS } from '@/lib/mock-data'
import { CloserDossier } from '@/components/leads/CloserDossier'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function DemoLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = MOCK_LEADS.find(l => l.id === id)
  if (!lead) notFound()

  const notes = lead.call_notes ?? []
  const openerNote = notes.find(n => n.role_context === 'Opener')
  const setterNote = notes.find(n => n.role_context === 'Setter')

  const backLink =
    ['Zu kontaktieren', 'Nicht erreicht', 'Neu'].includes(lead.status) ? '/demo/opener' :
    ['Interessiert', 'Setter-Call geplant', 'Setter qualifiziert'].includes(lead.status) ? '/demo/setter' :
    '/demo/closer'

  const backLabel =
    backLink === '/demo/opener' ? '← Opener Dashboard' :
    backLink === '/demo/setter' ? '← Setter Dashboard' :
    '← Closer Dashboard'

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Link href={backLink} className="text-sm text-slate-500 hover:text-slate-800 inline-block">
        {backLabel}
      </Link>
      <CloserDossier lead={lead} openerNote={openerNote} setterNote={setterNote} />

      {/* Demo note form placeholder */}
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-slate-400">
        <p className="font-medium text-slate-500 mb-1">Notiz erfassen</p>
        <p className="text-sm">Im Demo-Modus nicht verfügbar — dafür braucht es echte Zugangsdaten (Supabase).</p>
      </div>
    </div>
  )
}
