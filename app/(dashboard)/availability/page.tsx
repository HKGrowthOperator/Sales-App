import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { groupSlotsByDay, slotTimeLabel } from '@/lib/scheduling/slots'
import { getAvailableSlotsWithGoogle } from '@/lib/scheduling/slotsServer'
import { CalendarClock, ShieldCheck, Clock } from 'lucide-react'

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const from = new Date()
  const to = new Date(from.getTime() + 7 * 86400e3)
  const [setterSlots, closerSlots] = await Promise.all([
    getAvailableSlotsWithGoogle({ supabase, roleType: 'setter', from, to }),
    getAvailableSlotsWithGoogle({ supabase, roleType: 'closer', from, to }),
  ])
  const googleChecked = [...setterSlots, ...closerSlots].some(s => s.source === 'google_checked')

  const sections = [
    { title: 'Setter-Verfügbarkeit', dot: 'bg-purple-500', groups: groupSlotsByDay(setterSlots), total: setterSlots.length },
    { title: 'Closer-Verfügbarkeit', dot: 'bg-blue-500', groups: groupSlotsByDay(closerSlots), total: closerSlots.length },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-blue-600" /> Verfügbarkeit (7 Tage)
          </h1>
          <p className="text-slate-500 text-sm">Freie Setter- und Closer-Slots für die direkte Buchung im Call.</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${googleChecked ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {googleChecked ? <><ShieldCheck className="h-3.5 w-3.5" /> Mit Google geprüft</> : <><Clock className="h-3.5 w-3.5" /> Interne Verfügbarkeit</>}
        </span>
      </div>

      {sections.map(sec => (
        <div key={sec.title}>
          <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${sec.dot}`} />
            {sec.title} <span className="text-sm font-normal text-slate-400">· {sec.total} freie Slots</span>
          </h2>
          {sec.groups.length === 0 ? (
            <div className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl p-6 text-center">
              Keine freien Slots. Verfügbarkeitsregeln prüfen (Admin → Verfügbarkeit).
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sec.groups.map(g => (
                <div key={g.date} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{g.label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.slots.slice(0, 16).map((s, i) => (
                      <span key={i} className={`text-xs px-2 py-1 rounded-lg border ${s.isRecommended ? 'border-green-300 bg-green-50 text-green-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                        {slotTimeLabel(s.startAt)} <span className="opacity-60">{s.userName.split(' ')[0]}</span>
                      </span>
                    ))}
                    {g.slots.length > 16 && <span className="text-xs text-slate-400 px-1 py-1">+{g.slots.length - 16}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
