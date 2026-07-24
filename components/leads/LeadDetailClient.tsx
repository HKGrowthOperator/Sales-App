'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lead, Profile, Script, CallNote, ObjectionItem, DecisionMaker, LeadStatus, OPENER_STATUSES, SETTER_STATUSES, CLOSER_STATUSES } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge, ScoreBadge } from '@/components/shared/StatusBadge'
import { CallNoteForm } from '@/components/leads/CallNoteForm'
import { CloserDossier } from '@/components/leads/CloserDossier'
import { ScriptPanel } from '@/components/leads/ScriptPanel'
import { NextAction } from '@/lib/leads/nextAction'
import { TimelineEvent } from '@/lib/leads/timeline'
import { NextActionBox, LeadTimeline, AppointmentsSection, MailsSection, FollowupsSection, AutomationSection } from '@/components/leads/LeadDossierSections'
import { formatDateTime, formatDate, getEntryAngleEmoji, timeAgo, stripMarkdown } from '@/lib/utils'
import { decisionMakerSummary } from '@/lib/leads/decisionMakers'
import { formatRevenue } from '@/lib/leads/normalize'
import { deriveWarnings, callReadiness, READINESS_LABEL, READINESS_STYLE, SEVERITY_STYLE } from '@/lib/leads/warnings'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/hooks/use-toast'
import {
  Phone, Globe, Instagram, Linkedin, Mail, ChevronLeft,
  Building2, User, Clock, Calendar, FileText, MessageSquare,
  ExternalLink, CheckCircle, XCircle, ArrowRight, Sparkles, Loader2, Trash2,
  AlertTriangle, ShieldAlert, Users, Lock, Unlock
} from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'

// Status options filtered per role
const ROLE_STATUS_OPTIONS: Record<string, LeadStatus[]> = {
  opener: ['Zu kontaktieren', 'Nicht erreicht', 'Interessiert', 'Nicht passend'],
  setter: ['Interessiert', 'Setter-Call geplant', 'Setter qualifiziert', 'Closer-Call geplant', 'Nicht passend'],
  closer: ['Closer-Call geplant', 'Angebot vorbereiten', 'Angebot gesendet', 'Follow-up', 'Gewonnen', 'Verloren', 'Nicht passend'],
  admin: ['Neu', 'Zu kontaktieren', 'Nicht erreicht', 'Interessiert', 'Setter-Call geplant', 'Setter qualifiziert', 'Closer-Call geplant', 'Angebot vorbereiten', 'Angebot gesendet', 'Follow-up', 'Gewonnen', 'Verloren', 'Nicht passend'],
}

interface Props {
  lead: Lead
  profile: Profile
  script: Script | null
  objections?: ObjectionItem[]
  allProfiles: Pick<Profile, 'id' | 'full_name' | 'role' | 'email'>[]
  nextAction?: NextAction
  timeline?: TimelineEvent[]
  dossierAppointments?: any[]
  followups?: any[]
  mails?: any[]
  automationLogs?: any[]
  decisionMakers?: DecisionMaker[]
}

export function LeadDetailClient({ lead: initialLead, profile, script, objections = [], allProfiles, nextAction, timeline = [], dossierAppointments = [], followups = [], mails = [], automationLogs = [], decisionMakers = [] }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [lead, setLead] = useState(initialLead)
  // Auto-open form if ?action=note is set (from dashboard CTA buttons)
  const [showCallForm, setShowCallForm] = useState(searchParams.get('action') === 'note')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [researching, setResearching] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [releasing, setReleasing] = useState(false)

  const [dmState, setDmState] = useState<DecisionMaker[]>(decisionMakers)
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null)

  // Abgeleitete Vertriebs-Intelligenz (rein aus vorhandenen Feldern)
  const warnings = deriveWarnings(lead)
  const readiness = callReadiness(lead, warnings)
  const dm = decisionMakerSummary(lead.management)

  // Primären Entscheider wählen (persistiert + als Ansprechpartner setzen)
  async function setPrimary(person: DecisionMaker) {
    setSettingPrimary(person.id)
    const supabase = createClient()
    await supabase.from('decision_makers').update({ is_primary: false }).eq('lead_id', lead.id)
    await supabase.from('decision_makers').update({ is_primary: true }).eq('id', person.id)
    const { error } = await supabase.from('leads')
      .update({ primary_decision_maker_id: person.id, contact_name: person.full_name, updated_at: new Date().toISOString() })
      .eq('id', lead.id)
    if (error) toast({ title: 'Fehler', description: error.message, variant: 'destructive' })
    else {
      setDmState(prev => prev.map(d => ({ ...d, is_primary: d.id === person.id })))
      setLead({ ...lead, contact_name: person.full_name, primary_decision_maker_id: person.id })
      toast({ title: 'Primärer Entscheider gesetzt', description: person.full_name })
    }
    setSettingPrimary(null)
  }

  // Admin: gesperrten Lead ("Nicht ansprechen") freigeben
  async function releaseLead() {
    setReleasing(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('leads')
      .update({ do_not_contact: false, opt_out_at: null, opt_out_reason: null, updated_at: new Date().toISOString() })
      .eq('id', lead.id)
    if (error) toast({ title: 'Fehler', description: error.message, variant: 'destructive' })
    else { setLead({ ...lead, do_not_contact: false }); toast({ title: 'Lead freigegeben', description: 'Erscheint wieder in der Call-Queue.' }); router.refresh() }
    setReleasing(false)
  }

  async function deleteLead() {
    if (!confirm(`Lead „${lead.company_name}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return
    setDeleting(true)
    try {
      const res = await fetch('/api/leads/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [lead.id] }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast({ title: 'Löschen fehlgeschlagen', description: data.detail || data.error || `HTTP ${res.status}`, variant: 'destructive' })
        setDeleting(false)
      } else {
        toast({ title: 'Lead gelöscht', description: lead.company_name })
        router.push('/leads')
      }
    } catch {
      toast({ title: 'Fehler', description: 'Lead konnte nicht gelöscht werden.', variant: 'destructive' })
      setDeleting(false)
    }
  }

  // Research-Refresh: Website/Social/Entscheider/Pain/Automatisierung neu recherchieren
  async function runResearch() {
    setResearching(true)
    try {
      const res = await fetch('/api/leads/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast({ title: 'Research fehlgeschlagen', description: data.detail || data.error || `HTTP ${res.status}`, variant: 'destructive' })
      } else if (!data.updated?.length) {
        toast({ title: 'Research fertig', description: data.message || 'Nichts Neues gefunden.' })
      } else {
        toast({ title: 'Research aktualisiert', description: `Neu: ${data.updated.join(', ')}` })
        router.refresh()
      }
    } catch {
      toast({ title: 'Fehler', description: 'Research konnte nicht ausgeführt werden.', variant: 'destructive' })
    } finally {
      setResearching(false)
    }
  }

  const notes = (lead.call_notes || []) as CallNote[]
  const openerNote = notes.filter(n => n.role_context === 'Opener').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  const setterNote = notes.filter(n => n.role_context === 'Setter').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  const closerNote = notes.filter(n => n.role_context === 'Closer').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  const statusOptions = ROLE_STATUS_OPTIONS[profile.role] || ROLE_STATUS_OPTIONS.admin

  async function updateStatus(newStatus: LeadStatus) {
    setUpdatingStatus(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', lead.id)
      .select()
      .single()

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' })
    } else if (data) {
      setLead({ ...lead, ...data })
      toast({ title: 'Status geändert', description: newStatus })
    }
    setUpdatingStatus(false)
  }

  function onNoteAdded(newNote: CallNote) {
    setLead(prev => ({
      ...prev,
      call_notes: [...(prev.call_notes || []), newNote],
    }))
    setShowCallForm(false)
    router.refresh()
  }

  const noteButtonLabel = {
    opener: 'Opener-Notiz eintragen',
    setter: 'Setter-Notiz eintragen',
    closer: 'Closer-Notiz eintragen',
    admin: 'Notiz eintragen',
  }[profile.role] || 'Notiz eintragen'

  const noteButtonColor = {
    opener: 'bg-orange-500 hover:bg-orange-600',
    setter: 'bg-purple-600 hover:bg-purple-700',
    closer: 'bg-blue-600 hover:bg-blue-700',
    admin: 'bg-slate-700 hover:bg-slate-800',
  }[profile.role] || 'bg-slate-700'

  // Opener + Setter sehen Script immer direkt — kein Tab-Klick nötig
  const scriptAboveTabs = profile.role === 'opener' || profile.role === 'setter'

  // Default tab: Closer → Dossier; Opener/Setter → info (Script ist already above)
  const defaultTab = profile.role === 'closer' || profile.role === 'admin'
    ? 'dossier'
    : 'info'

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2">
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <ScoreBadge score={lead.lead_score} />
            <h1 className="text-2xl font-bold text-slate-900">{lead.company_name}</h1>
            <StatusBadge status={lead.status} />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${READINESS_STYLE[readiness]}`}>
              {READINESS_LABEL[readiness]}
            </span>
          </div>
          <p className="text-slate-500 mt-1">
            {lead.contact_name || (
              <span className={dm.multiple ? 'text-amber-600 font-medium' : 'text-slate-400 italic'}>{dm.label}</span>
            )}
            {lead.role_title ? ` · ${lead.role_title}` : ''}
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="ml-3 text-blue-600 font-semibold hover:underline">
                {lead.phone}
              </a>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Button
            size="xl"
            className={noteButtonColor}
            onClick={() => setShowCallForm(!showCallForm)}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            {showCallForm ? 'Schließen' : noteButtonLabel}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={runResearch} disabled={researching}>
              {researching
                ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Recherchiere…</>
                : <><Sparkles className="h-4 w-4 mr-1" /> Research aktualisieren</>}
            </Button>
            {profile.role === 'admin' && (
              <Button variant="outline" size="sm" onClick={deleteLead} disabled={deleting}
                className="text-red-600 border-red-200 hover:bg-red-50">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Warnungen & Call-Readiness (strukturiert, nicht in Notizen versteckt) */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${SEVERITY_STYLE[w.severity]}`}>
              {w.severity === 'gesperrt' ? <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                : w.severity === 'kritisch' ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />}
              <span className="font-medium">{w.label}</span>
              {w.detail && <span className="opacity-80">— {stripMarkdown(w.detail)}</span>}
              {w.severity === 'gesperrt' && profile.role === 'admin' && (
                <button onClick={releaseLead} disabled={releasing}
                  className="ml-auto text-xs underline flex items-center gap-1 shrink-0">
                  <Unlock className="h-3 w-3" /> Freigeben
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Entscheider — persistiert (auswählbarer Primär) oder aus String geparst */}
      {(dmState.length > 0 || dm.people.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" /> Entscheider
              {((dmState.length > 1 && !dmState.some(d => d.is_primary)) || (!dmState.length && dm.multiple)) &&
                <span className="text-xs font-normal text-amber-600">— bitte primären auswählen</span>}
              {(dmState.some(d => d.verification_status === 'widersprüchlich') || (!dmState.length && dm.conflict)) &&
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">widersprüchlich – prüfen</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {dmState.length > 0 ? (
              dmState.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <User className={`h-3.5 w-3.5 shrink-0 ${p.is_primary ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${p.is_primary ? 'text-blue-700' : 'text-slate-800'}`}>{p.full_name}</span>
                  {p.role_title && <span className="text-xs text-slate-400">· {p.role_title}</span>}
                  {p.note && <span className="text-xs text-slate-400">({stripMarkdown(p.note)})</span>}
                  {p.is_primary
                    ? <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 ml-1">primär</span>
                    : <button onClick={() => setPrimary(p)} disabled={settingPrimary === p.id}
                        className="ml-auto text-xs text-slate-500 hover:text-blue-600 underline shrink-0">
                        {settingPrimary === p.id ? '…' : 'Als primär'}
                      </button>}
                </div>
              ))
            ) : (
              dm.people.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-800">{p.fullName}</span>
                  {p.note && <span className="text-xs text-slate-400">({stripMarkdown(p.note)})</span>}
                </div>
              ))
            )}
            <p className="text-[11px] text-slate-400 pt-1">Quelle: verifizierte Geschäftsführung aus der Leadliste.</p>
          </CardContent>
        </Card>
      )}

      {/* Next Action — operativer Kompass */}
      {nextAction && <NextActionBox action={nextAction} />}

      {/* Radar-Kontext — rollenspezifische Pains + Befund */}
      {(lead.opener_pitch || lead.setter_context || lead.closer_context || lead.radar_analysis || lead.automation_potential) && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-700">🛰 Radar-Kontext</div>
          {(() => {
            const items: Array<[string, string | null | undefined]> =
              profile.role === 'admin'
                ? [['Opener', lead.opener_pitch], ['Setter', lead.setter_context], ['Closer', lead.closer_context]]
                : profile.role === 'setter' ? [['Setter', lead.setter_context]]
                : profile.role === 'closer' ? [['Closer', lead.closer_context]]
                : [['Opener', lead.opener_pitch]]
            return items.filter(([, v]) => !!v).map(([label, v]) => (
              <p key={label} className="text-sm text-slate-700"><span className="font-semibold text-violet-700">{label}: </span>{v}</p>
            ))
          })()}
          {lead.automation_potential && (
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-violet-700">⚙️ Automatisierung: </span>{lead.automation_potential}
            </p>
          )}
          {lead.radar_analysis && (
            <div className="bg-white rounded-lg border border-slate-200 p-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Befund</p>
              <p className="text-xs text-slate-600 whitespace-pre-line">{lead.radar_analysis}</p>
            </div>
          )}
        </div>
      )}

      {/* Firmenprofil & Vertriebsintelligenz (Wachstumssystem-Liste) */}
      {(lead.cluster || lead.employee_count || lead.management || lead.package_potential
        || lead.cross_sell_score != null || lead.key_bottlenecks || lead.hiring_signal
        || lead.approach_notes || lead.recommended_entry || lead.owner_led) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              🏢 Firmenprofil &amp; Vertriebsintelligenz
              {lead.cross_sell_score != null && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Cross-Sell {lead.cross_sell_score}/6
                </span>
              )}
              {lead.package_potential && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {lead.package_potential}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {lead.cluster && <div><span className="text-slate-400">Cluster: </span><span className="text-slate-700">{lead.cluster}</span></div>}
              {lead.employee_count && <div><span className="text-slate-400">Mitarbeiter: </span><span className="text-slate-700">{lead.employee_count}</span></div>}
              {lead.open_positions_raw && <div><span className="text-slate-400">Offene Stellen: </span><span className="text-slate-700">{stripMarkdown(lead.open_positions_raw)}</span></div>}
              <div><span className="text-slate-400">Umsatz: </span><span className="text-slate-700">{formatRevenue(lead)}</span></div>
              {lead.verification_status && <div><span className="text-slate-400">Verifizierung: </span><span className="text-slate-700">{lead.verification_status}</span></div>}
              {lead.management && <div><span className="text-slate-400">Geschäftsführung: </span><span className="text-slate-700">{lead.management}</span></div>}
              {lead.owner_led && <div><span className="text-slate-400">Inhabergeführt: </span><span className="text-slate-700">{lead.owner_led}</span></div>}
              {lead.address && <div className="sm:col-span-2"><span className="text-slate-400">Adresse: </span><span className="text-slate-700">{lead.address}</span></div>}
            </div>
            {lead.hiring_signal && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">🔥 Akuter Anlass / Kaufsignal</span>
                <p className="text-slate-700 mt-0.5">{stripMarkdown(lead.hiring_signal)}</p>
              </div>
            )}
            {lead.key_bottlenecks && (
              <div><span className="text-slate-400">Engstellen: </span><span className="text-slate-700">{stripMarkdown(lead.key_bottlenecks)}</span></div>
            )}
            {lead.recommended_entry && (
              <div><span className="text-slate-400">Empfohlener Einstieg: </span><span className="text-slate-700">{lead.recommended_entry}</span></div>
            )}
            {(lead.offer_level1 || lead.offer_level2 || lead.offer_level3) && (
              <div className="grid gap-1 pt-1">
                {lead.offer_level1 && <p className="text-xs text-slate-600"><span className="font-semibold text-slate-500">Ebene 1 – Wahrnehmung: </span>{lead.offer_level1}</p>}
                {lead.offer_level2 && <p className="text-xs text-slate-600"><span className="font-semibold text-slate-500">Ebene 2 – Gewinnung: </span>{lead.offer_level2}</p>}
                {lead.offer_level3 && <p className="text-xs text-slate-600"><span className="font-semibold text-slate-500">Ebene 3 – Skalierung: </span>{lead.offer_level3}</p>}
              </div>
            )}
            {lead.approach_notes && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">📌 Hinweise für Ansprache</span>
                <p className="text-slate-700 mt-0.5">{stripMarkdown(lead.approach_notes)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Call Note Form — auto-open from ?action=note */}
      {showCallForm && (
        <CallNoteForm
          lead={lead}
          profile={profile}
          onSuccess={onNoteAdded}
          onCancel={() => setShowCallForm(false)}
        />
      )}

      {/* Script — direkt sichtbar für Opener + Setter, KEIN Tab-Klick nötig */}
      {scriptAboveTabs && (
        <div className="rounded-xl border-2 border-slate-100 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">📋 Skript</span>
            {lead.entry_angle && (
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {lead.entry_angle}
              </span>
            )}
          </div>
          {lead.pain_guess && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-yellow-700">Pain: </span>
              <span className="text-xs text-slate-700">{lead.pain_guess}</span>
            </div>
          )}
          <ScriptPanel script={script} lead={lead} profile={profile} objections={objections} />
        </div>
      )}

      {/* Status Bar */}
      <Card>
        <CardContent className="p-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-slate-600 shrink-0">Status:</span>
          <Select value={lead.status} onValueChange={v => updateStatus(v as LeadStatus)} disabled={updatingStatus}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {lead.last_contact_at && (
            <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
              <Clock className="h-3 w-3" /> Letzter Kontakt: {timeAgo(lead.last_contact_at)}
            </span>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <div className="sticky top-16 z-20 bg-slate-50 py-2 -mt-2 overflow-x-auto">
        <TabsList className="w-max h-auto gap-1 p-1">
          {(profile.role === 'closer' || profile.role === 'admin') && (
            <TabsTrigger value="dossier">Dossier</TabsTrigger>
          )}
          {/* Script-Tab nur für Closer/Admin — Opener+Setter sehen es direkt oben */}
          {(profile.role === 'closer' || profile.role === 'admin') && (
            <TabsTrigger value="script">Skript</TabsTrigger>
          )}
          <TabsTrigger value="info">Übersicht</TabsTrigger>
          <TabsTrigger value="verlauf">
            Verlauf {notes.length > 0 && <span className="ml-1 bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 text-xs">{notes.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="agenda">
            Termine & Follow-ups {(dossierAppointments.length + followups.length) > 0 && <span className="ml-1 bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 text-xs">{dossierAppointments.length + followups.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="system">
            {(profile.role === 'admin' || profile.role === 'closer') ? 'Mails & Automation' : 'Mails'} {mails.length > 0 && <span className="ml-1 bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 text-xs">{mails.length}</span>}
          </TabsTrigger>
        </TabsList>
        </div>

        {/* Dossier Tab — Closer + Admin */}
        {(profile.role === 'closer' || profile.role === 'admin') && (
          <TabsContent value="dossier">
            <CloserDossier lead={lead} openerNote={openerNote} setterNote={setterNote} />
          </TabsContent>
        )}

        {/* Script Tab — nur für Closer + Admin (Opener/Setter sehen es direkt oben) */}
        {(profile.role === 'closer' || profile.role === 'admin') && (
          <TabsContent value="script">
            <ScriptPanel script={script} lead={lead} profile={profile} objections={objections} />
          </TabsContent>
        )}

        {/* Lead Info Tab */}
        <TabsContent value="info">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Unternehmen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Branche" value={lead.industry} />
                <InfoRow label="Lead-Quelle" value={lead.lead_source} />
                <InfoRow label="Einstiegswinkel" value={lead.entry_angle ? `${getEntryAngleEmoji(lead.entry_angle)} ${lead.entry_angle}` : null} />
                {lead.website && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Website</span>
                    <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      {lead.website} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {lead.instagram && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Instagram</span>
                    <a href={`https://${lead.instagram}`} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-600 hover:underline flex items-center gap-1">
                      Instagram <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {lead.linkedin && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">LinkedIn</span>
                    <a href={`https://${lead.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      LinkedIn <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" /> Kontakt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Ansprechpartner" value={lead.contact_name} />
                <InfoRow label="Position" value={lead.role_title} />
                {lead.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Telefon</span>
                    <a href={`tel:${lead.phone}`} className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {lead.phone}
                    </a>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">E-Mail</span>
                    <a href={`mailto:${lead.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {lead.email}
                    </a>
                  </div>
                )}
                <InfoRow label="Bevorzugter Kanal" value={lead.preferred_contact_channel} />
                <InfoRow label="Entscheider-Status" value={lead.decision_maker_status} />
              </CardContent>
            </Card>

            {(lead.pain_guess || lead.next_step || lead.followup_at || lead.appointment_at) && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Sales-Einschätzung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.pain_guess && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Vermuteter Pain</p>
                      <p className="text-sm text-slate-700 bg-yellow-50 rounded-lg p-3 border border-yellow-100">{lead.pain_guess}</p>
                    </div>
                  )}
                  {lead.next_step && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Nächster Schritt</p>
                      <p className="text-sm text-slate-700">{lead.next_step}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {lead.followup_at && (
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                        <p className="text-xs font-medium text-amber-700 mb-0.5">Follow-up fällig</p>
                        <p className="text-sm font-semibold text-amber-800">{formatDate(lead.followup_at)}</p>
                      </div>
                    )}
                    {lead.appointment_at && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs font-medium text-blue-700 mb-0.5">Termin</p>
                        <p className="text-sm font-semibold text-blue-800">{formatDateTime(lead.appointment_at)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Verlauf — Timeline + Notizen ("Was ist passiert?") */}
        <TabsContent value="verlauf" className="space-y-5">
          <div>
            <SectionHeading>Timeline</SectionHeading>
            <Card><CardContent className="p-4"><LeadTimeline events={timeline} /></CardContent></Card>
          </div>
          <div>
            <SectionHeading>Notizen</SectionHeading>
            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>Noch keine Notizen</p>
                  <Button onClick={() => setShowCallForm(true)} className="mt-3" size="sm">
                    Erste Notiz eintragen
                  </Button>
                </div>
              ) : (
                [...notes]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map(note => <NoteCard key={note.id} note={note} />)
              )}
            </div>
          </div>
        </TabsContent>

        {/* Termine & Follow-ups ("Was steht an?") */}
        <TabsContent value="agenda" className="space-y-5">
          <div>
            <SectionHeading>Termine</SectionHeading>
            <AppointmentsSection appointments={dossierAppointments} actorUserId={profile.id} />
          </div>
          <div>
            <SectionHeading>Follow-ups</SectionHeading>
            <FollowupsSection followups={followups} />
          </div>
        </TabsContent>

        {/* Mails & Automation ("Was hat das System getan?") */}
        <TabsContent value="system" className="space-y-5">
          <div>
            <SectionHeading>Mails</SectionHeading>
            <MailsSection mails={mails} />
          </div>
          {(profile.role === 'admin' || profile.role === 'closer') && (
            <div>
              <SectionHeading>Automation-Logs</SectionHeading>
              <Card><CardContent className="p-4"><AutomationSection logs={automationLogs} /></CardContent></Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">{children}</h3>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs text-slate-800 font-medium">{value || '–'}</span>
    </div>
  )
}

function NoteCard({ note }: { note: CallNote }) {
  const roleColors: Record<string, string> = {
    'Opener': 'border-orange-200 bg-orange-50',
    'Setter': 'border-purple-200 bg-purple-50',
    'Closer': 'border-blue-200 bg-blue-50',
  }
  const roleTextColors: Record<string, string> = {
    'Opener': 'text-orange-700',
    'Setter': 'text-purple-700',
    'Closer': 'text-blue-700',
  }

  return (
    <Card className={`border ${roleColors[note.role_context] || ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold ${roleTextColors[note.role_context]}`}>{note.role_context}</span>
            {note.call_result && (
              <span className="text-xs bg-white border rounded-full px-2 py-0.5">{note.call_result}</span>
            )}
            {note.interest_level && (
              <span className="text-xs">{'⭐'.repeat(note.interest_level)}</span>
            )}
            {(note as any).user?.full_name && (
              <span className="text-xs text-slate-400">· {(note as any).user.full_name}</span>
            )}
          </div>
          <span className="text-xs text-slate-400 shrink-0">{timeAgo(note.created_at)}</span>
        </div>
        {note.raw_note && <p className="text-sm text-slate-700 mb-2 leading-relaxed">{note.raw_note}</p>}
        {note.structured_summary && (
          <div className="bg-white rounded-lg p-2 border border-slate-200 text-xs text-slate-600 whitespace-pre-line">
            {note.structured_summary}
          </div>
        )}
        {note.next_step && (
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" /> <span className="font-medium">Nächster Schritt:</span> {note.next_step}
          </p>
        )}
        {note.objections && note.objections.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {note.objections.map((obj, i) => (
              <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-100 rounded px-1.5 py-0.5">{obj}</span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
