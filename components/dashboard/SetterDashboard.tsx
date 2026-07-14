'use client'

import Link from 'next/link'
import { Profile, Lead, Appointment, Followup, CallNote } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { RadarHook } from '@/components/shared/RadarHook'
import { Button } from '@/components/ui/button'
import { StatusBadge, ScoreBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatDate, timeAgo, getEntryAngleEmoji } from '@/lib/utils'
import { Phone, Calendar, ChevronRight, Clock, Star, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

interface Props {
  profile: Profile
  leads: Lead[]
  appointments: Appointment[]
  followups: Followup[]
  linkPrefix?: string
}

// Rules a Setter must check before releasing to Closer
const CLOSER_GATE = [
  'Pain klar und bestätigt',
  'Entscheider bestätigt im Call dabei',
  'Timing passt (kein "vielleicht nächstes Jahr")',
  'Score A oder B — kein C, kein No-Fit',
]

export function SetterDashboard({ profile, leads, appointments, followups, linkPrefix = '/leads' }: Props) {
  const interested = leads.filter(l => l.status === 'Interessiert')
  const scheduled = leads.filter(l => l.status === 'Setter-Call geplant')
  const qualified = leads.filter(l => l.status === 'Setter qualifiziert')

  // Priority order: Setter-Call geplant first, then Interessiert, then qualifiziert
  const sorted = [...scheduled, ...interested, ...qualified]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Guten Tag, {profile.full_name?.split(' ')[0] || 'Setter'} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Qualifizieren — Pain · Potenzial · Entscheider · Timing.
          <span className="font-medium text-slate-700"> Du entscheidest, wer zum Closer kommt.</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Setter-Call geplant" value={scheduled.length} color="purple" />
        <StatCard label="Interessiert" value={interested.length} color="yellow" />
        <StatCard label="Qualifiziert" value={qualified.length} color="green" />
      </div>

      {/* Closer-Gate Reminder */}
      <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
        <p className="text-sm font-semibold text-purple-800 mb-2">Checkliste vor Closer-Freigabe — alle 4 müssen erfüllt sein:</p>
        <div className="grid sm:grid-cols-2 gap-1.5">
          {CLOSER_GATE.map((rule, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-purple-700">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-purple-400" />
              {rule}
            </div>
          ))}
        </div>
      </div>

      {/* Today's Appointments */}
      {appointments.length > 0 && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-purple-700 font-medium text-sm flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4" /> Heutige Setter-Calls
          </p>
          <div className="space-y-2">
            {appointments.map(appt => (
              <Link key={appt.id} href={`${linkPrefix}/${appt.lead_id}?action=note`}>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{(appt.lead as any)?.company_name}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(appt.appointment_at)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Follow-ups */}
      {followups.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium text-sm flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4" /> Fällige Follow-ups
          </p>
          <div className="space-y-2">
            {followups.slice(0, 3).map(f => (
              <Link key={f.id} href={`${linkPrefix}/${f.lead_id}`}>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{(f.lead as any)?.company_name}</p>
                    <p className="text-xs text-slate-500">{f.type} · fällig {formatDate(f.due_at)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Leads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Zu qualifizieren <span className="text-slate-400 text-base font-normal">({sorted.length})</span>
          </h2>
          <Link href="/leads">
            <Button variant="outline" size="sm">Alle anzeigen</Button>
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg">Keine Leads zur Qualifizierung</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map(lead => <SetterLeadCard key={lead.id} lead={lead} linkPrefix={linkPrefix} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function SetterLeadCard({ lead, linkPrefix = '/leads' }: { lead: Lead; linkPrefix?: string }) {
  // Explicitly find Opener note — not just any first note
  const allNotes = (lead as any).call_notes as CallNote[] | undefined
  const openerNote = allNotes?.find(n => n.role_context === 'Opener')

  const isScheduled = lead.status === 'Setter-Call geplant'

  return (
    <Card className={`hover:shadow-md transition-shadow ${isScheduled ? 'ring-1 ring-purple-300' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <ScoreBadge score={lead.lead_score} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span>{getEntryAngleEmoji(lead.entry_angle)}</span>
              <h3 className="font-semibold text-slate-900">{lead.company_name}</h3>
              <StatusBadge status={lead.status} />
            </div>

            {lead.contact_name && (
              <p className="text-sm text-slate-600">{lead.contact_name}{lead.role_title ? ` · ${lead.role_title}` : ''}</p>
            )}

            {/* Pain — always prominent for Setter */}
            {lead.pain_guess && (
              <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-yellow-700">Vermuteter Pain: </span>
                <span className="text-xs text-slate-700">{lead.pain_guess}</span>
              </div>
            )}

            {/* Radar — Qualifizierungs-Hook für den Setter */}
            <RadarHook text={lead.setter_context} label="Quali-Hook" className="mt-2" />

            {/* Opener note — explicitly filtered */}
            {openerNote ? (
              <div className="mt-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-orange-600 mb-0.5">Opener-Notiz:</p>
                <p className="text-xs text-slate-700 line-clamp-2">{openerNote.raw_note}</p>
                {openerNote.call_result && (
                  <span className="inline-block text-xs text-orange-600 mt-1">→ {openerNote.call_result}</span>
                )}
              </div>
            ) : (
              <div className="mt-2 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-400 italic">Keine Opener-Notiz vorhanden</p>
              </div>
            )}

            {lead.last_contact_at && (
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeAgo(lead.last_contact_at)}
              </p>
            )}
          </div>

          <Link href={`${linkPrefix}/${lead.id}?action=note`}>
            <Button
              size="lg"
              className="shrink-0 h-14 px-4 flex-col gap-0.5 bg-purple-600 hover:bg-purple-700"
            >
              <Phone className="h-4 w-4" />
              <span className="text-xs">Quali</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  }
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80 leading-tight">{label}</p>
    </div>
  )
}
