'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAvailableSlots, groupSlotsByDay, slotTimeLabel, Slot, DaySlots, SchedRole } from '@/lib/scheduling/slots'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, CalendarClock, Star, Check, CalendarX, ShieldCheck, Clock } from 'lucide-react'

export interface SelectedSlot {
  assignedUserId: string
  assignedUserName: string
  startAt: string
  endAt: string
  durationMinutes: number
}

interface Props {
  roleType: SchedRole
  selected: SelectedSlot | null
  onSelect: (s: SelectedSlot) => void
  days?: number
}

export function SlotPicker({ roleType, selected, onSelect, days = 7 }: Props) {
  const [groups, setGroups] = useState<DaySlots[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [googleChecked, setGoogleChecked] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const supabase = createClient()
      const from = new Date()
      const to = new Date(from.getTime() + days * 86400e3)
      const slots = await getAvailableSlots({ supabase, roleType, from, to })
      setGoogleChecked(slots.some(s => s.source === 'google_checked'))
      setGroups(groupSlotsByDay(slots))
    } catch (e: any) {
      setError(e?.message || 'Fehler beim Laden der Slots')
    } finally {
      setLoading(false)
    }
  }, [roleType, days])

  useEffect(() => { load() }, [load])

  const isSel = (s: Slot) =>
    selected && selected.startAt === s.startAt && selected.assignedUserId === s.userId

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarClock className="h-4 w-4 text-blue-600" />
          {roleType === 'setter' ? 'Setter-Termin wählen' : 'Closer-Termin wählen'}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 ${googleChecked ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {googleChecked ? <><ShieldCheck className="h-3 w-3" /> Mit Google geprüft</> : <><Clock className="h-3 w-3" /> Interne Verfügbarkeit</>}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={load} disabled={loading} className="h-7 px-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-3 max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Verfügbare Slots werden geladen…
          </div>
        ) : error ? (
          <div className="text-sm text-red-600 py-6 text-center">{error}</div>
        ) : groups.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center flex flex-col items-center gap-2">
            <CalendarX className="h-7 w-7 opacity-30" />
            Keine freien Slots in den nächsten {days} Tagen.
            <span className="text-xs">Verfügbarkeit prüfen (Admin → Verfügbarkeit) oder Zeitraum erweitern.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(g => (
              <div key={g.date}>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{g.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {g.slots.map((s, i) => (
                    <button
                      key={`${s.userId}-${s.startAt}-${i}`}
                      type="button"
                      onClick={() => onSelect({ assignedUserId: s.userId, assignedUserName: s.userName, startAt: s.startAt, endAt: s.endAt, durationMinutes: s.durationMinutes })}
                      className={`px-2.5 py-1.5 rounded-lg border text-sm transition-all flex items-center gap-1.5 ${
                        isSel(s)
                          ? 'border-blue-500 bg-blue-600 text-white ring-2 ring-blue-200'
                          : s.isRecommended
                          ? 'border-green-300 bg-green-50 text-green-800 hover:border-green-400'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                      }`}
                      title={`${s.userName} · ${s.durationMinutes} Min`}
                    >
                      {isSel(s) ? <Check className="h-3.5 w-3.5" /> : s.isRecommended ? <Star className="h-3 w-3 text-green-500" /> : null}
                      <span className="font-semibold">{slotTimeLabel(s.startAt)}</span>
                      <span className="text-xs opacity-70">{s.userName.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="px-3 py-2 border-t border-slate-100 bg-blue-50 text-xs text-blue-800 flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5" />
          Gewählt: <strong>{selected.assignedUserName}</strong> am {new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selected.startAt))} Uhr
        </div>
      )}
    </div>
  )
}
