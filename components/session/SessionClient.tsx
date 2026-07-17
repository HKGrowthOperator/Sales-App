'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lead, Profile, Script, ObjectionItem, CallSession, SessionLead, CallNote, RoleContext } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { selectScriptForLead, fetchObjectionsFor, pillarAngleFor } from '@/lib/script-routing'
import { ScriptPanel } from '@/components/leads/ScriptPanel'
import { CallNoteForm } from '@/components/leads/CallNoteForm'
import { ScoreBadge, StatusBadge } from '@/components/shared/StatusBadge'
import { RadarHook } from '@/components/shared/RadarHook'
import { toast } from '@/lib/hooks/use-toast'
import { getEntryAngleEmoji } from '@/lib/utils'
import {
  Phone, Globe, Instagram, Linkedin, PlayCircle, SkipForward, Flag,
  Loader2, CheckCircle2, ListChecks, PhoneCall, Building2
} from 'lucide-react'

type SLWithLead = SessionLead & { lead: Lead }

interface Props {
  profile: Profile
  roleLabel: RoleContext
  session: CallSession | null
  sessionLeads: SLWithLead[]
  candidates: Lead[]
}

export function SessionClient({ profile, roleLabel, session, sessionLeads, candidates }: Props) {
  const router = useRouter()
  const [reviewing, setReviewing] = useState(false)

  if (!session) return <StartScreen profile={profile} roleLabel={roleLabel} candidates={candidates} />

  const done = sessionLeads.filter(sl => sl.state !== 'pending').length
  const total = sessionLeads.length
  const current = sessionLeads.find(sl => sl.state === 'pending') || null

  if (reviewing || !current) {
    return <ReviewScreen session={session} done={done} total={total} />
  }

  return (
    <CallScreen
      key={current.id}
      profile={profile}
      roleLabel={roleLabel}
      session={session}
      sessionLead={current}
      done={done}
      total={total}
      onSkip={() => router.refresh()}
      onEnd={() => setReviewing(true)}
    />
  )
}

// ─── START ────────────────────────────────────────────────────────────────────
function StartScreen({ profile, roleLabel, candidates }: { profile: Profile; roleLabel: RoleContext; candidates: Lead[] }) {
  const router = useRouter()
  const [goal, setGoal] = useState('')
  const [count, setCount] = useState(Math.min(candidates.length, 20))
  const [loading, setLoading] = useState(false)

  async function start() {
    if (candidates.length === 0) return
    setLoading(true)
    const supabase = createClient()
    const { data: sess, error } = await supabase.from('call_sessions').insert({
      user_id: profile.id, role_context: roleLabel,
      session_goal: goal.trim() || null, status: 'aktiv', planned_lead_count: count,
    }).select('id').single()
    if (error || !sess) { setLoading(false); toast({ title: 'Fehler', description: error?.message, variant: 'destructive' }); return }

    const rows = candidates.slice(0, count).map((l, i) => ({ session_id: sess.id, lead_id: l.id, position: i }))
    await supabase.from('session_leads').insert(rows)
    toast({ title: 'Session gestartet', description: `${rows.length} Leads in der Queue` })
    router.refresh()
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Call-Session starten</h1>
        <p className="text-slate-500 text-sm">Rolle: <strong>{roleLabel}</strong> · {candidates.length} Leads bereit</p>
      </div>

      {candidates.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-slate-400">
          <PhoneCall className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Aktuell keine passenden Leads in deiner Queue.</p>
          <Link href="/dashboard" className="text-blue-600 text-sm hover:underline mt-2 inline-block">Zum Dashboard</Link>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Ziel dieser Session <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Textarea rows={2} value={goal} onChange={e => setGoal(e.target.value)}
                placeholder="z.B. 20 Erstkontakte, 3 Setter-Termine" className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Anzahl Leads für diese Session</Label>
              <Input type="number" min={1} max={candidates.length} value={count}
                onChange={e => setCount(Math.max(1, Math.min(candidates.length, Number(e.target.value))))} />
            </div>
            <Button size="lg" onClick={start} disabled={loading} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
              Session starten ({count} Leads)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ─── CALL ─────────────────────────────────────────────────────────────────────
// Die 4 HK-Leistungspfeiler — Auswahl schreibt den kanonischen Einstiegswinkel
// an den Lead und steuert damit Skript, Bestätigungs-Mail (product_area) und Radar.
const PILLARS: { angle: string; label: string }[] = [
  { angle: 'Website', label: '🌐 Website' },
  { angle: 'Social Media', label: '📣 Social & Branding' },
  { angle: 'Automationen & CRM', label: '🤖 KI-Automation' },
  { angle: 'Komplettangebot', label: '📈 Wachstumssystem' },
]

function CallScreen({ profile, roleLabel, session, sessionLead, done, total, onSkip, onEnd }: {
  profile: Profile; roleLabel: RoleContext; session: CallSession; sessionLead: SLWithLead
  done: number; total: number; onSkip: () => void; onEnd: () => void
}) {
  const router = useRouter()
  const lead = sessionLead.lead
  const [script, setScript] = useState<Script | null>(null)
  const [objections, setObjections] = useState<ObjectionItem[]>([])
  const [loadingScript, setLoadingScript] = useState(true)
  const [skipping, setSkipping] = useState(false)
  // Pfeiler-Umschalter + Phasen-Vorschau (eigene Rolle = Standard)
  const [entryAngle, setEntryAngle] = useState<string | null>(lead.entry_angle)
  const [viewRole, setViewRole] = useState<RoleContext>(roleLabel)

  useEffect(() => {
    let active = true
    const supabase = createClient()
    setLoadingScript(true)
    Promise.all([
      selectScriptForLead(supabase, { roleLabel: viewRole, userId: profile.id, entryAngle }),
      fetchObjectionsFor(supabase, viewRole, entryAngle),
    ]).then(([s, o]) => { if (active) { setScript(s); setObjections(o); setLoadingScript(false) } })
    return () => { active = false }
  }, [lead.id, viewRole, profile.id, entryAngle])

  // Pfeiler wählen → entry_angle am Lead speichern (steuert Mail-Vorlage + Radar)
  async function choosePillar(angle: string) {
    if (pillarAngleFor(entryAngle) === angle) return
    setEntryAngle(angle)
    const supabase = createClient()
    const { error } = await supabase.from('leads')
      .update({ entry_angle: angle, updated_at: new Date().toISOString() })
      .eq('id', lead.id)
    if (error) toast({ title: 'Pfeiler nicht gespeichert', description: error.message, variant: 'destructive' })
    else toast({ title: 'Pfeiler gesetzt', description: PILLARS.find(p => p.angle === angle)?.label })
  }

  async function handleSaved(note: CallNote) {
    const supabase = createClient()
    await supabase.from('session_leads').update({
      state: 'done', outcome: note.call_result, call_note_id: note.id, handled_at: new Date().toISOString(),
    }).eq('id', sessionLead.id)
    router.refresh()
  }

  async function skip() {
    setSkipping(true)
    const supabase = createClient()
    await supabase.from('session_leads').update({ state: 'skipped', handled_at: new Date().toISOString() }).eq('id', sessionLead.id)
    onSkip()
  }

  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Lead {done + 1} von {total}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEnd} className="gap-1.5"><Flag className="h-3.5 w-3.5" /> Session beenden</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Lead-Card + Script */}
        <div className="space-y-4">
          <Card className="border-2 border-blue-100">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={lead.lead_score} />
                    <h2 className="text-lg font-bold text-slate-900">{lead.company_name}</h2>
                  </div>
                  {lead.contact_name && <p className="text-sm text-slate-500">{lead.contact_name}{lead.role_title ? ` · ${lead.role_title}` : ''}</p>}
                </div>
                <StatusBadge status={lead.status} />
              </div>

              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-xl font-bold text-blue-600 hover:underline">
                  <Phone className="h-5 w-5" /> {lead.phone}
                </a>
              )}

              <div className="flex flex-wrap gap-3 text-sm">
                {lead.website && <a href={ensureHttp(lead.website)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-600 hover:text-blue-600"><Globe className="h-4 w-4" /> Website</a>}
                {lead.instagram && <a href={ensureHttp(lead.instagram)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-600 hover:text-pink-600"><Instagram className="h-4 w-4" /> Instagram</a>}
                {lead.linkedin && <a href={ensureHttp(lead.linkedin)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-600 hover:text-blue-700"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
              </div>

              {lead.entry_angle && (
                <span className="inline-block text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {getEntryAngleEmoji(lead.entry_angle)} {lead.entry_angle}
                </span>
              )}

              {lead.pain_guess && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold text-yellow-700">Pain-Vermutung: </span>
                  <span className="text-xs text-slate-700">{lead.pain_guess}</span>
                </div>
              )}
              {lead.relevance_reason && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold text-blue-700">Warum jetzt: </span>
                  <span className="text-xs text-slate-700">{lead.relevance_reason}</span>
                </div>
              )}
              <RadarHook
                text={roleLabel === 'Setter' ? lead.setter_context : roleLabel === 'Closer' ? lead.closer_context : lead.opener_pitch}
                label={`${roleLabel}-Pain`}
              />

              <button onClick={skip} disabled={skipping}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                <SkipForward className="h-3.5 w-3.5" /> Überspringen
              </button>
            </CardContent>
          </Card>

          {/* Script — mit Pfeiler-Umschalter + Phasen-Vorschau */}
          <Card><CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {PILLARS.map(p => {
                  const active = pillarAngleFor(entryAngle) === p.angle
                  return (
                    <button key={p.angle} onClick={() => choosePillar(p.angle)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}>
                      {p.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-1.5">
                {(['Opener', 'Setter', 'Closer'] as RoleContext[]).map(r => (
                  <button key={r} onClick={() => setViewRole(r)}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                      viewRole === r
                        ? 'bg-slate-800 text-white border-slate-800 font-semibold'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}>
                    {r}{r === roleLabel ? ' (meine Phase)' : ''}
                  </button>
                ))}
              </div>
            </div>
            {loadingScript
              ? <div className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Skript wird geladen…</div>
              : <ScriptPanel script={script} lead={lead} profile={profile} objections={objections} />}
          </CardContent></Card>
        </div>

        {/* Notiz direkt nach dem Call (Pflicht) */}
        <div className="lg:sticky lg:top-20 self-start w-full">
          <CallNoteForm
            lead={lead}
            profile={profile}
            onSuccess={handleSaved}
            onCancel={skip}
            afterSaveRedirect={false}
          />
        </div>
      </div>
    </div>
  )
}

// ─── REVIEW ─────────────────────────────────────────────────────────────────--
function ReviewScreen({ session, done, total }: { session: CallSession; done: number; total: number }) {
  const router = useRouter()
  const [whatWorked, setWhatWorked] = useState('')
  const [whatToImprove, setWhatToImprove] = useState('')
  const [commonObjections, setCommonObjections] = useState('')
  const [contentIdeas, setContentIdeas] = useState('')
  const [learnings, setLearnings] = useState('')
  const [loading, setLoading] = useState(false)

  async function finish() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('call_sessions').update({
      status: 'abgeschlossen',
      ended_at: new Date().toISOString(),
      review_done: true,
      what_worked: whatWorked.trim() || null,
      what_to_improve: whatToImprove.trim() || null,
      common_objections: commonObjections.trim() ? commonObjections.split(',').map(s => s.trim()).filter(Boolean) : null,
      content_ideas: contentIdeas.trim() || null,
      learnings: learnings.trim() || null,
    }).eq('id', session.id)
    toast({ title: 'Session abgeschlossen', description: `${done}/${total} Leads bearbeitet` })
    router.push('/dashboard')
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-slate-900">Session-Review</h1>
        <p className="text-slate-500 text-sm">{done} von {total} Leads bearbeitet — kurz reflektieren, dann abschließen.</p>
      </div>
      <Card><CardContent className="p-5 space-y-4">
        <Field label="Was hat gut funktioniert?" value={whatWorked} set={setWhatWorked} />
        <Field label="Was sollte verbessert werden?" value={whatToImprove} set={setWhatToImprove} />
        <Field label="Häufige Einwände (kommagetrennt)" value={commonObjections} set={setCommonObjections} rows={2} />
        <Field label="Content-Ideen aus den Calls" value={contentIdeas} set={setContentIdeas} rows={2} />
        <Field label="Wichtigste Learnings / zu priorisierende Leads" value={learnings} set={setLearnings} rows={2} />
        <Button size="lg" onClick={finish} disabled={loading} className="w-full gap-2 bg-green-600 hover:bg-green-700">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ListChecks className="h-5 w-5" />} Session abschließen
        </Button>
      </CardContent></Card>
    </div>
  )
}

function Field({ label, value, set, rows = 3 }: { label: string; value: string; set: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea rows={rows} value={value} onChange={e => set(e.target.value)} className="resize-none" />
    </div>
  )
}

function ensureHttp(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`
}
