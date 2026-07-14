import { MOCK_LEADS, MOCK_PROFILES, MOCK_SCRIPTS } from '@/lib/mock-data'
import { OpenerDashboard } from '@/components/dashboard/OpenerDashboard'

export default function DemoOpenerPage() {
  const profile = MOCK_PROFILES.opener
  const leads = MOCK_LEADS.filter(l => ['Zu kontaktieren', 'Nicht erreicht', 'Neu'].includes(l.status))

  return (
    <div className="max-w-2xl mx-auto p-4">
      <OpenerDashboard
        profile={profile}
        leads={leads}
        followups={[]}
        scripts={MOCK_SCRIPTS}
        linkPrefix="/demo/lead"
      />
    </div>
  )
}
