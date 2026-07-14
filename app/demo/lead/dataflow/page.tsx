import { MOCK_LEADS } from '@/lib/mock-data'
import { CloserDossier } from '@/components/leads/CloserDossier'
import Link from 'next/link'

export default function DemoDataflowPage() {
  const lead = MOCK_LEADS.find(l => l.id === 'lead-4')!
  const notes = lead.call_notes ?? []
  const openerNote = notes.find(n => n.role_context === 'Opener')
  const setterNote = notes.find(n => n.role_context === 'Setter')

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/demo/closer" className="text-sm text-slate-500 hover:text-slate-800">← Closer Dashboard</Link>
        <span className="text-slate-300">|</span>
        <Link href="/demo/lead/finke" className="text-sm text-slate-500 hover:text-slate-800">Finke Immobilien →</Link>
      </div>
      <CloserDossier lead={lead} openerNote={openerNote} setterNote={setterNote} />
    </div>
  )
}
