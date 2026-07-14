'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Profile, Appointment, AppointmentStatus } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime, isToday, isTomorrow, isOverdue, getEntryAngleEmoji } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { AppointmentControls } from '@/components/scheduling/AppointmentControls'
import { toast } from '@/lib/hooks/use-toast'
import { Calendar, Clock, ChevronRight, CheckCircle, XCircle, Mail } from 'lucide-react'

interface Props {
  profile: Profile
  initialAppointments: Appointment[]
  closers: Pick<Profile, 'id' | 'full_name' | 'role' | 'email'>[]
}

const STATUS_OPTIONS: AppointmentStatus[] = ['Geplant', 'Bestätigt', 'Stattgefunden', 'Abgesagt', 'No-Show']

export function AppointmentsClient({ profile, initialAppointments, closers }: Props) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [filter, setFilter] = useState<'alle' | 'heute' | 'upcoming' | 'past'>('heute')

  const supabase = createClient()

  const filtered = appointments.filter(a => {
    const dt = new Date(a.appointment_at)
    const now = new Date()
    if (filter === 'heute') return isToday(a.appointment_at)
    if (filter === 'upcoming') return dt > now && !isToday(a.appointment_at)
    if (filter === 'past') return dt < now && !isToday(a.appointment_at)
    return true
  })

  const todayCount = appointments.filter(a => isToday(a.appointment_at)).length
  const upcomingCount = appointments.filter(a => {
    const dt = new Date(a.appointment_at)
    return dt > new Date() && !isToday(a.appointment_at)
  }).length

  async function updateStatus(id: string, newStatus: AppointmentStatus) {
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id)
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' })
      return
    }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    toast({ title: 'Status aktualisiert', description: newStatus })
  }

  async function updateReminderStatus(id: string, field: 'confirmation_email_status' | 'reminder_24h_status' | 'reminder_1h_status', value: string) {
    const { error } = await supabase.from('appointments').update({ [field]: value }).eq('id', id)
    if (!error) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Termine</h1>
        <p className="text-slate-500 text-sm">Alle geplanten Setter- und Closer-Calls</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => setFilter('heute')} className={`rounded-xl border p-3 text-left transition-all ${filter === 'heute' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-blue-50'}`}>
          <p className={`text-2xl font-bold ${filter === 'heute' ? 'text-white' : 'text-blue-600'}`}>{todayCount}</p>
          <p className={`text-xs ${filter === 'heute' ? 'text-blue-100' : 'text-slate-500'}`}>Heute</p>
        </button>
        <button onClick={() => setFilter('upcoming')} className={`rounded-xl border p-3 text-left transition-all ${filter === 'upcoming' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white hover:bg-purple-50'}`}>
          <p className={`text-2xl font-bold ${filter === 'upcoming' ? 'text-white' : 'text-purple-600'}`}>{upcomingCount}</p>
          <p className={`text-xs ${filter === 'upcoming' ? 'text-purple-100' : 'text-slate-500'}`}>Bevorstehend</p>
        </button>
        <button onClick={() => setFilter('alle')} className={`rounded-xl border p-3 text-left transition-all ${filter === 'alle' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white hover:bg-slate-50'}`}>
          <p className={`text-2xl font-bold ${filter === 'alle' ? 'text-white' : 'text-slate-700'}`}>{appointments.length}</p>
          <p className={`text-xs ${filter === 'alle' ? 'text-slate-300' : 'text-slate-500'}`}>Gesamt</p>
        </button>
      </div>

      {/* Appointment List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Keine Termine in dieser Ansicht</p>
          </div>
        ) : (
          filtered.map(appt => (
            <AppointmentCard key={appt.id} appointment={appt} actorUserId={profile.id} onReminderChange={updateReminderStatus} />
          ))
        )}
      </div>
    </div>
  )
}

function AppointmentCard({
  appointment: appt,
  actorUserId,
  onReminderChange,
}: {
  appointment: Appointment
  actorUserId: string
  onReminderChange: (id: string, field: any, value: string) => void
}) {
  const lead = (appt as any).lead
  const overdue = isOverdue(appt.appointment_at) && appt.status === 'Geplant'
  const today = isToday(appt.appointment_at)

  const typeColors: Record<string, string> = {
    'Closer-Call': 'bg-blue-100 text-blue-700 border-blue-200',
    'Setter-Call': 'bg-purple-100 text-purple-700 border-purple-200',
    'Follow-up': 'bg-amber-100 text-amber-700 border-amber-200',
  }

  return (
    <Card className={`${today ? 'ring-2 ring-blue-400' : ''} ${overdue ? 'border-red-200 bg-red-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-1 min-w-0 w-full">
            {/* Type + Time */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${typeColors[appt.appointment_type] || 'bg-gray-100 text-gray-700'}`}>
                {appt.appointment_type}
              </span>
              <span className={`text-sm font-semibold flex items-center gap-1 ${overdue ? 'text-red-600' : today ? 'text-blue-600' : 'text-slate-700'}`}>
                <Clock className="h-3.5 w-3.5" />
                {formatDateTime(appt.appointment_at)}
                {today && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 rounded-full ml-1">Heute</span>}
                {overdue && <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded-full ml-1">Überfällig</span>}
              </span>
            </div>

            {/* Lead Info */}
            {lead && (
              <Link href={`/leads/${appt.lead_id}`} className="group">
                <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{lead.company_name}</p>
                {lead.contact_name && <p className="text-sm text-slate-500">{lead.contact_name}</p>}
              </Link>
            )}

            {/* Reminder Status */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <ReminderPill
                label="Bestätigung"
                status={appt.confirmation_email_status}
                onChange={v => onReminderChange(appt.id, 'confirmation_email_status', v)}
              />
              <ReminderPill
                label="24h Reminder"
                status={appt.reminder_24h_status}
                onChange={v => onReminderChange(appt.id, 'reminder_24h_status', v)}
              />
              <ReminderPill
                label="1h Reminder"
                status={appt.reminder_1h_status}
                onChange={v => onReminderChange(appt.id, 'reminder_1h_status', v)}
              />
            </div>
          </div>

          {/* Aktionen + Status/Sync via zentrale Services */}
          <div className="shrink-0 flex flex-col items-end gap-2 w-full sm:w-[260px]">
            <AppointmentControls appt={appt as any} actorUserId={actorUserId} />
            <Link href={`/leads/${appt.lead_id}`}>
              <Button size="sm" variant="ghost" className="text-xs h-7">
                Lead öffnen <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReminderPill({ label, status, onChange }: { label: string; status: string; onChange: (v: string) => void }) {
  const colors: Record<string, string> = {
    'ausstehend': 'bg-slate-100 text-slate-500',
    'gesendet': 'bg-green-100 text-green-700',
    'fehlgeschlagen': 'bg-red-100 text-red-600',
  }

  function cycle() {
    const next: Record<string, string> = {
      'ausstehend': 'gesendet',
      'gesendet': 'fehlgeschlagen',
      'fehlgeschlagen': 'ausstehend',
    }
    onChange(next[status] || 'ausstehend')
  }

  return (
    <button
      onClick={cycle}
      className={`text-xs px-2 py-0.5 rounded-full transition-colors cursor-pointer ${colors[status] || 'bg-slate-100 text-slate-500'}`}
      title={`${label}: ${status} (klicken zum Ändern)`}
    >
      {label}: {status}
    </button>
  )
}
