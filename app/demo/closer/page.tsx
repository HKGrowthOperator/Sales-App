import { MOCK_LEADS, MOCK_PROFILES, MOCK_APPOINTMENTS } from '@/lib/mock-data'
import { CloserDashboard } from '@/components/dashboard/CloserDashboard'

export default function DemoCloserPage() {
  const profile = MOCK_PROFILES.closer
  const leads = MOCK_LEADS.filter(l =>
    ['Closer-Call geplant', 'Angebot vorbereiten', 'Angebot gesendet', 'Follow-up'].includes(l.status)
  )

  return (
    <div className="max-w-2xl mx-auto p-4">
      <CloserDashboard
        profile={profile}
        leads={leads}
        appointments={MOCK_APPOINTMENTS}
        followups={[]}
        linkPrefix="/demo/lead"
      />
    </div>
  )
}
