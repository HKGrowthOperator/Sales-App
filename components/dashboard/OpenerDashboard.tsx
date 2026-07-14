'use client'

import Link from 'next/link'
import { Profile, Lead, Followup, Script } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RadarHook } from '@/components/shared/RadarHook'
import { formatDate, getEntryAngleEmoji, timeAgo } from '@/lib/utils'
import { Phone, Globe, Instagram, Linkedin, ChevronRight, Clock, AlertCircle, ArrowRight } from 'lucide-react'

interface Props {
  profile: Profile
  leads: Lead[]
  followups: Followup[]
  scripts?: Script[]
  linkPrefix?: string
}

export function OpenerDashboard({ profile, leads, followups, scripts = [], linkPrefix = '/leads' }: Props) {
  const newLeads = leads.filter(l => l.status === 'Neu' || l.status === 'Zu kontaktieren')
  const missedLeads = leads.filter(l => l.status === 'Nicht erreicht')

  // Sort: Neu/Zu kontaktieren first, then Nicht erreicht; within group by created_at
  const sorted = [
    ...newLeads,
    ...missedLeads,
  ]

  function getScriptOpener(lead: Lead): string | null {
    if (!scripts.length) return null
    const match = scripts.find(s =>
      s.role === 'Opener' && s.entry_angle === lead.entry_angle && s.is_active
    ) || scripts.find(s => s.role === 'Opener' && s.is_active)
    return match?.opening_line
      ?.replace('[KONTAKTNAME]', lead.contact_name || 'Ansprechpartner')
      ?.replace('[UNTERNEHMEN]', lead.company_name)
      ?.split('\n')[0] // only first line for preview
      || null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Guten Tag, {profile.full_name?.split(' ')[0] || 'Opener'} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Erstkontakt · Entscheider finden · Interesse wecken.
          <span className="font-medium text-slate-700"> Du verkaufst nichts.</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Neu / Zu kontaktieren" value={newLeads.length} color="blue" />
        <StatCard label="Nicht erreicht" value={missedLeads.length} color="orange" />
        <StatCard label="Fällige Follow-ups" value={followups.length} color="red" />
      </div>

      {/* Overdue Follow-ups */}
      {followups.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium text-sm flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4" /> Fällige Follow-ups — zuerst erledigen
          </p>
          <div className="space-y-2">
            {followups.map(f => (
              <Link key={f.id} href={`/leads/${f.lead_id}`}>
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

      {/* Lead List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Deine Leads <span className="text-slate-400 text-base font-normal">({sorted.length})</span>
          </h2>
          <Link href="/leads">
            <Button variant="outline" size="sm">Alle anzeigen</Button>
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Phone className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg">Keine offenen Leads.</p>
            <p className="text-sm mt-1">Sehr gut — alles abgearbeitet!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((lead, index) => (
              <OpenerLeadCard
                key={lead.id}
                lead={lead}
                index={index + 1}
                scriptOpener={getScriptOpener(lead)}
                linkPrefix={linkPrefix}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OpenerLeadCard({ lead, index, scriptOpener, linkPrefix = '/leads' }: { lead: Lead; index: number; scriptOpener: string | null; linkPrefix?: string }) {
  const isNotReached = lead.status === 'Nicht erreicht'

  return (
    <Card className={`hover:shadow-md transition-shadow ${isNotReached ? 'border-orange-200 bg-orange-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Number */}
          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
            isNotReached ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-700'
          }`}>
            {index}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span>{getEntryAngleEmoji(lead.entry_angle)}</span>
              <h3 className="font-semibold text-slate-900">{lead.company_name}</h3>
              <StatusBadge status={lead.status} />
            </div>

            {/* Contact + Phone */}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {lead.contact_name && (
                <span className="text-sm text-slate-600">{lead.contact_name}{lead.role_title ? ` · ${lead.role_title}` : ''}</span>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-semibold">
                  <Phone className="h-3.5 w-3.5" /> {lead.phone}
                </a>
              )}
              {lead.website && (
                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-700">
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {lead.instagram && (
                <a href={`https://${lead.instagram}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-500">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {lead.linkedin && (
                <a href={`https://${lead.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Pain — prominent */}
            {lead.pain_guess && (
              <div className="mt-2 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-yellow-700">Pain: </span>
                <span className="text-xs text-slate-700">{lead.pain_guess}</span>
              </div>
            )}

            {/* Radar — rollenspezifischer Aufhänger */}
            <RadarHook text={lead.opener_pitch} label="Aufhänger" className="mt-2" />

            {/* Script opener preview */}
            {scriptOpener && (
              <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-slate-500">Einstieg: </span>
                <span className="text-xs text-slate-700 italic line-clamp-2">"{scriptOpener}"</span>
              </div>
            )}

            {lead.last_contact_at && (
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Letzter Kontakt: {timeAgo(lead.last_contact_at)}
              </p>
            )}
          </div>

          {/* CTA */}
          <Link href={`${linkPrefix}/${lead.id}?action=note`}>
            <Button
              size="lg"
              className={`shrink-0 h-14 px-5 flex-col gap-0.5 text-center ${
                isNotReached
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Phone className="h-4 w-4" />
              <span className="text-xs">Call</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-80 leading-tight">{label}</p>
    </div>
  )
}
