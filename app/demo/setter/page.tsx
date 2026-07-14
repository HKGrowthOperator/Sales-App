import { MOCK_LEADS, MOCK_PROFILES } from '@/lib/mock-data'
import { SetterDashboard } from '@/components/dashboard/SetterDashboard'

export default function DemoSetterPage() {
  const profile = MOCK_PROFILES.setter
  const leads = MOCK_LEADS.filter(l => ['Interessiert', 'Setter-Call geplant', 'Setter qualifiziert'].includes(l.status))

  return (
    <div className="max-w-2xl mx-auto p-4">
      <SetterDashboard
        profile={profile}
        leads={leads}
        appointments={[]}
        followups={[]}
        linkPrefix="/demo/lead"
      />
    </div>
  )
}
