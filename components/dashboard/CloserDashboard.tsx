'use client'

import Link from 'next/link'
import { Profile, Lead, Appointment, Followup } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadarHook } from '@/components/shared/RadarHook'
import { Button } from '@/components/ui/button'
import { StatusBadge, ScoreBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatDate, getEntryAngleEmoji } from '@/lib/utils'
import { Calendar, ChevronRight, Briefcase, Globe, Instagram, Linkedin, Clock, Users } from 'lucide-react'

interface Props {
  profile: Profile
  leads: Lead[]
  appointments: Appointment[]
  followups: Followup[]
  linkPrefix?: string
}

export function CloserDashboard({ profile, leads, appointments, followups, linkPrefix = '/leads' }: Props) {
  const todayCalls = appointments.filter(a => a.appointment_type === 'Closer-Call')
  const offerPending = leads.filter(l => l.status === 'Angebot vorbereiten' || l.status === 'Angebot gesendet')
  const followupLeads = leads.filter(l => l.status === 'Follow-up')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Guten Tag, {profile.full_name?.split(' ')[0] || 'Closer'} 👋
        </h1>
        <p className="text-slate-500 mt-1">Deine heutigen Calls und offenen Angebote.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Closer-Calls heute" value={todayCalls.length} color="blue" />
        <StatCard label="Angebote offen" value={offerPending.length} color="teal" />
        <StatCard label="Follow-ups" value={followupLeads.length} color="amber" />
        <StatCard label="Fällige Tasks" value={followups.length} color="red" />
      </div>

      {/* Today's Closer Calls */}
      {appointments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" /> Heutige Termine
          </h2>
          <div className="space-y-3">
            {appointments.map(appt => (
              <Card key={appt.id} className="border-blue-100 bg-blue-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          {appt.appointment_type}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatDateTime(appt.appointment_at)}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{(appt.lead as any)?.company_name}</p>
                      {(appt.lead as any)?.contact_name && (
                        <p className="text-sm text-slate-500">{(appt.lead as any)?.contact_name}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          appt.status === 'Bestätigt' ? 'bg-green-100 text-green-700' :
                          appt.status === 'Geplant' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{appt.status}</span>
                      </div>
                    </div>
                    <Link href={`${linkPrefix}/${appt.lead_id}`}>
                      <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12">
                        Dossier öffnen
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Closer Leads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Aktive Leads</h2>
          <Link href="/leads">
            <Button variant="outline" size="sm">Alle anzeigen</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {leads.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Keine aktiven Leads</p>
            </div>
          ) : (
            leads.map(lead => (
              <CloserLeadCard key={lead.id} lead={lead} linkPrefix={linkPrefix} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function CloserLeadCard({ lead, linkPrefix = '/leads' }: { lead: Lead; linkPrefix?: string }) {
  const notes = (lead as any).call_notes || []
  const openerNote = notes.find((n: any) => n.role_context === 'Opener')
  const setterNote = notes.find((n: any) => n.role_context === 'Setter')

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <ScoreBadge score={lead.lead_score} />
              <h3 className="font-semibold text-slate-900">{lead.company_name}</h3>
              <StatusBadge status={lead.status} />
              {lead.entry_angle && (
                <span className="text-xs text-slate-500">{getEntryAngleEmoji(lead.entry_angle)} {lead.entry_angle}</span>
              )}
            </div>
            {lead.contact_name && (
              <p className="text-sm text-slate-600">{lead.contact_name}{lead.role_title ? ` · ${lead.role_title}` : ''}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {lead.website && <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600"><Globe className="h-3.5 w-3.5" /></a>}
              {lead.instagram && <a href={`https://${lead.instagram}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-500"><Instagram className="h-3.5 w-3.5" /></a>}
              {lead.linkedin && <a href={`https://${lead.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600"><Linkedin className="h-3.5 w-3.5" /></a>}
            </div>
            {(openerNote || setterNote) && (
              <div className="mt-2 space-y-1">
                {openerNote && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-1 line-clamp-1">
                    <span className="font-medium">Opener:</span> {openerNote.raw_note}
                  </p>
                )}
                {setterNote && (
                  <p className="text-xs text-slate-500 bg-purple-50 rounded px-2 py-1 line-clamp-1">
                    <span className="font-medium">Setter:</span> {setterNote.raw_note}
                  </p>
                )}
              </div>
            )}
            {/* Radar — Diagnose-Kontext für den Closer */}
            <RadarHook text={lead.closer_context} label="Diagnose" className="mt-2" />

            {lead.appointment_at && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Termin: {formatDateTime(lead.appointment_at)}
              </p>
            )}
          </div>
          <Link href={`${linkPrefix}/${lead.id}`}>
            <Button size="lg" className="shrink-0 bg-blue-600 hover:bg-blue-700 h-12 px-5">
              Dossier
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  )
}
