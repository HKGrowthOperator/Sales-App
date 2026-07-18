'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Profile, Lead, LeadStatus, LeadScore, OPENER_STATUSES, SETTER_STATUSES, CLOSER_STATUSES } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge, ScoreBadge } from '@/components/shared/StatusBadge'
import { getEntryAngleEmoji, formatDate, timeAgo } from '@/lib/utils'
import { Search, Phone, Globe, ChevronRight, Filter, Plus, Upload } from 'lucide-react'

const ALL_STATUSES: LeadStatus[] = [
  'Neu', 'Zu kontaktieren', 'Nicht erreicht', 'Interessiert',
  'Setter-Call geplant', 'Setter qualifiziert', 'Closer-Call geplant',
  'Angebot vorbereiten', 'Angebot gesendet', 'Follow-up',
  'Gewonnen', 'Verloren', 'Nicht passend',
]

const ROLE_STATUS_MAP: Record<string, LeadStatus[]> = {
  opener: OPENER_STATUSES,
  setter: SETTER_STATUSES,
  closer: CLOSER_STATUSES,
  admin: ALL_STATUSES,
}

interface Props {
  profile: Profile
  initialLeads: Lead[]
}

export function LeadsListClient({ profile, initialLeads }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'alle'>('alle')
  const [scoreFilter, setScoreFilter] = useState<LeadScore | 'alle'>('alle')

  const relevantStatuses = ROLE_STATUS_MAP[profile.role] || ALL_STATUSES

  const filtered = useMemo(() => {
    return initialLeads.filter(lead => {
      const matchSearch =
        !search ||
        lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
        lead.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.industry?.toLowerCase().includes(search.toLowerCase())

      const matchStatus =
        statusFilter === 'alle' || lead.status === statusFilter

      const matchScore =
        scoreFilter === 'alle' || lead.lead_score === scoreFilter

      return matchSearch && matchStatus && matchScore
    })
  }, [initialLeads, search, statusFilter, scoreFilter])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm">{filtered.length} von {initialLeads.length} Leads</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/upload">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-1" /> Importieren
            </Button>
          </Link>
          <Link href="/leads/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" /> Lead hinzufügen
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Unternehmen, Kontakt, Branche..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Score Filter */}
          {(['alle', 'A', 'B', 'C', 'No-Fit'] as const).map(s => (
            <Button
              key={s}
              variant={scoreFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScoreFilter(s)}
              className={scoreFilter === s ? 'bg-blue-600' : ''}
            >
              {s === 'alle' ? 'Alle' : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Status Pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('alle')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            statusFilter === 'alle'
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Alle Status
        </button>
        {relevantStatuses.map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? 'alle' : status)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === status
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Lead Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg">Keine Leads gefunden</p>
            <p className="text-sm">Passe den Filter an oder füge einen neuen Lead hinzu</p>
          </div>
        ) : (
          filtered.map(lead => (
            <Link key={lead.id} href={`/leads/${lead.id}`}>
              <Card className="hover:shadow-md transition-all hover:border-blue-200 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <ScoreBadge score={lead.lead_score} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-semibold text-slate-900 truncate">{lead.company_name}</span>
                        <StatusBadge status={lead.status} />
                        {lead.entry_angle && (
                          <span className="text-xs text-slate-400">{getEntryAngleEmoji(lead.entry_angle)} {lead.entry_angle}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {lead.contact_name && (
                          <span className="text-sm text-slate-500">{lead.contact_name}</span>
                        )}
                        {lead.industry && (
                          <span className="text-xs text-slate-400">· {lead.industry}</span>
                        )}
                        {lead.phone && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </span>
                        )}
                      </div>
                      {lead.last_contact_at && (
                        <p className="text-xs text-slate-400 mt-1">Letzter Kontakt: {timeAgo(lead.last_contact_at)}</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
