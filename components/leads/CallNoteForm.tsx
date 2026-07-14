'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lead, Profile, CallNote, CallResult, RoleContext, EntryAngle } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { runCallNoteAutomations } from '@/lib/automations'
import { bookAppointment } from '@/lib/scheduling/bookAppointment'
import { SlotPicker, SelectedSlot } from '@/components/scheduling/SlotPicker'
import { toast } from '@/lib/hooks/use-toast'
import { Loader2, Phone, CheckCircle, XCircle, Clock, ArrowRight, CalendarClock } from 'lucide-react'

interface Props {
  lead: Lead
  profile: Profile
  onSuccess: (note: CallNote) => void
  onCancel: () => void
  afterSaveRedirect?: boolean   // Opener: nach Speichern zum Dashboard (default true). In Session: false.
}

export function CallNoteForm({ lead, profile, onSuccess, onCancel, afterSaveRedirect = true }: Props) {
  const roleContext: RoleContext =
    profile.role === 'opener' ? 'Opener' :
    profile.role === 'setter' ? 'Setter' : 'Closer'

  if (roleContext === 'Opener') return <OpenerNoteForm lead={lead} profile={profile} onSuccess={onSuccess} onCancel={onCancel} afterSaveRedirect={afterSaveRedirect} />
  if (roleContext === 'Setter') return <SetterNoteForm lead={lead} profile={profile} onSuccess={onSuccess} onCancel={onCancel} />
  return <CloserNoteForm lead={lead} profile={profile} onSuccess={onSuccess} onCancel={onCancel} />
}

// ============================================================
// OPENER FORM — minimal, schnell, 60 Sekunden
// ============================================================
function OpenerNoteForm({ lead, profile, onSuccess, onCancel, afterSaveRedirect = true }: Props) {
  const router = useRouter()
  const [result, setResult] = useState<CallResult | ''>('')
  const [rawNote, setRawNote] = useState('')
  const [emailConfirmed, setEmailConfirmed] = useState(false)
  const [slot, setSlot] = useState<SelectedSlot | null>(null)
  const [loading, setLoading] = useState(false)

  const RESULTS: { value: CallResult; label: string; color: string }[] = [
    { value: 'Nicht erreicht', label: 'Nicht erreicht', color: 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100' },
    { value: 'Kein Interesse', label: 'Kein Interesse', color: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' },
    { value: 'Falscher Ansprechpartner', label: 'Falscher AP', color: 'border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100' },
    { value: 'Interessiert', label: 'Interessiert', color: 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' },
    { value: 'Rückruf vereinbart', label: 'Rückruf vereinbart', color: 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
    { value: 'Termin vereinbart', label: 'Termin vereinbart', color: 'border-blue-300 bg-blue-500 text-white hover:bg-blue-600' },
    { value: 'Später erneut kontaktieren', label: 'Später erneut', color: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' },
    { value: 'Nicht passend', label: 'Nicht passend', color: 'border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100' },
    { value: 'Nicht mehr kontaktieren', label: '⛔ Nicht mehr kontaktieren', color: 'border-zinc-400 bg-zinc-200 text-zinc-800 hover:bg-zinc-300' },
  ]

  const selectedResult = RESULTS.find(r => r.value === result)

  const isBooking = result === 'Termin vereinbart'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!result) {
      toast({ title: 'Ergebnis fehlt', description: 'Bitte wähle das Call-Ergebnis aus.', variant: 'destructive' })
      return
    }
    if (isBooking && !slot) {
      toast({ title: 'Slot fehlt', description: 'Bitte einen Setter-Termin auswählen.', variant: 'destructive' })
      return
    }
    setLoading(true)
    const supabase = createClient()

    const { data: newNote, error } = await supabase
      .from('call_notes')
      .insert({
        lead_id: lead.id,
        user_id: profile.id,
        role_context: 'Opener',
        call_result: result,
        raw_note: rawNote.trim() || null,
        email_confirmed: emailConfirmed,
      })
      .select('*, user:profiles(full_name, role)')
      .single()

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    // ── Buchungs-Pfad: Setter-Termin via Booking Service ──
    if (isBooking && slot) {
      const res = await bookAppointment({
        supabase, leadId: lead.id, type: 'setter_call',
        assignedUserId: slot.assignedUserId, bookedByUserId: profile.id, sourceRole: 'opener',
        startAt: slot.startAt, endAt: slot.endAt, durationMinutes: slot.durationMinutes,
        contextNote: rawNote.trim() || null,
        customerEmail: emailConfirmed ? lead.email : (lead.email || null),
        attendees: lead.contact_name ? [lead.contact_name] : null,
      })
      setLoading(false)
      if (!res.ok) {
        toast({ title: 'Buchung fehlgeschlagen', description: res.message, variant: 'destructive' })
        if (res.code === 'slot_taken') setSlot(null)
        return
      }
      const mailHint = res.mailStatus === 'blocked_missing_email' ? ' · ⚠ keine E-Mail' : ' · Mail-Preview erstellt'
      toast({ title: '✓ Setter-Termin gebucht', description: `${slot.assignedUserName}${mailHint}` })
      onSuccess(newNote as CallNote)
      if (afterSaveRedirect) router.push('/dashboard')
      return
    }

    // ── Standard-Pfad: Automations-Kaskade ──
    const auto = await runCallNoteAutomations({
      supabase, lead, profile, role: 'Opener', result: result as CallResult,
      rawNote: rawNote.trim(),
      customerEmail: emailConfirmed ? lead.email : null,
    })
    setLoading(false)

    const extra = [
      auto.status ? `Status → ${auto.status}` : null,
      auto.followupCreated ? 'Follow-up gesetzt' : null,
      auto.optedOut ? '⛔ Opt-out aktiv' : null,
    ].filter(Boolean).join(' · ')
    toast({ title: 'Notiz gespeichert!', description: `${lead.company_name}${extra ? ' — ' + extra : ''}` })
    onSuccess(newNote as CallNote)
    if (afterSaveRedirect) router.push('/dashboard')
  }

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-orange-700">
          <Phone className="h-4 w-4" /> Call-Ergebnis — {lead.company_name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Big result buttons — primary action */}
          <div>
            <Label className="mb-2 block text-sm font-semibold">Was ist passiert? *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RESULTS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setResult(r.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all text-center ${
                    result === r.value
                      ? r.color + ' ring-2 ring-offset-1 ring-current'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Setter-Slot wählen — nur bei Termin vereinbart */}
          {isBooking && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-blue-700">
                <CalendarClock className="h-4 w-4" /> Setter-Termin direkt buchen *
              </Label>
              <SlotPicker roleType="setter" selected={slot} onSelect={setSlot} />
              <p className="text-xs text-slate-500">Slot wählen → beim Speichern wird atomar gebucht (Termin, Status, Mail-Preview, Reminder).</p>
            </div>
          )}

          {/* Short note — only what's relevant */}
          <div className="space-y-1.5">
            <Label>Kurze Notiz <span className="text-slate-400 font-normal">(optional — Reaktion, Einwand, Sonstiges)</span></Label>
            <Textarea
              placeholder="Was hat der Kontakt gesagt? Besondere Reaktion? Einwand?"
              value={rawNote}
              onChange={e => setRawNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* E-Mail checkbox — relevant for Opener */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={emailConfirmed}
              onChange={e => setEmailConfirmed(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">E-Mail-Adresse bestätigt</span>
          </label>

          <div className="flex gap-3 pt-1">
            <Button type="submit" size="lg" disabled={loading || !result || (isBooking && !slot)} className="bg-orange-500 hover:bg-orange-600 flex-1 sm:flex-none">
              {loading ? <><Loader2 className="animate-spin h-4 w-4" /> Speichere…</> : isBooking ? 'Termin buchen & weiter' : 'Speichern & weiter'}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>Abbrechen</Button>
          </div>

          {result === 'Nicht mehr kontaktieren' && (
            <p className="text-xs text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-lg p-2">
              ⛔ Harter Opt-out: Lead wird aus allen Queues entfernt und für Follow-ups/Termine technisch gesperrt.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

// ============================================================
// SETTER FORM — Checkliste + Score + Closer-Entscheidung
// ============================================================

const HK_TOPICS: EntryAngle[] = ['Website', 'Social Media', 'Anfragen', 'Außenwirkung', 'KI-Zeitersparnis', 'Recruiting']

const SETTER_CHECKLIST = [
  { id: 'pain_confirmed', label: 'Pain klar und vom Lead selbst bestätigt' },
  { id: 'potential_clear', label: 'Potenzial vorhanden (Budget / Wachstumswille erkennbar)' },
  { id: 'decision_maker_confirmed', label: 'Entscheider ist im Closer-Call dabei' },
  { id: 'timing_ok', label: 'Timing passt — kein "vielleicht nächstes Jahr"' },
]

function SetterNoteForm({ lead, profile, onSuccess, onCancel }: Props) {
  const [score, setScore] = useState<'A' | 'B' | 'C' | 'No-Fit' | ''>('')
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [interestTopics, setInterestTopics] = useState<string[]>([])
  const [rawNote, setRawNote] = useState('')
  const [decisionMakers, setDecisionMakers] = useState('')
  const [closerDecision, setCloserDecision] = useState<'yes' | 'no' | ''>('')
  const [closerSlot, setCloserSlot] = useState<SelectedSlot | null>(null)
  const [loading, setLoading] = useState(false)

  const allChecksPassed = SETTER_CHECKLIST.every(c => checklist[c.id])
  const canReleaseToCloser = allChecksPassed && (score === 'A' || score === 'B')

  function toggleTopic(topic: string) {
    setInterestTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rawNote.trim()) {
      toast({ title: 'Notiz fehlt', description: 'Bitte trage eine Setter-Notiz ein.', variant: 'destructive' })
      return
    }
    if (!score) {
      toast({ title: 'Score fehlt', description: 'Bitte vergib A / B / C / No-Fit.', variant: 'destructive' })
      return
    }
    if (!closerDecision) {
      toast({ title: 'Entscheidung fehlt', description: 'Closer-Call ja oder nein?', variant: 'destructive' })
      return
    }
    if (closerDecision === 'yes' && !closerSlot) {
      toast({ title: 'Slot fehlt', description: 'Bitte einen Closer-Termin auswählen.', variant: 'destructive' })
      return
    }
    setLoading(true)
    const supabase = createClient()

    const callResult: CallResult = closerDecision === 'yes' ? 'Qualifiziert für Closer' : 'Nicht passend'

    const { data: newNote, error } = await supabase
      .from('call_notes')
      .insert({
        lead_id: lead.id,
        user_id: profile.id,
        role_context: 'Setter',
        call_result: callResult,
        raw_note: rawNote.trim(),
        decision_makers_needed: decisionMakers.trim() || null,
        interest_topics: interestTopics.length ? interestTopics : null,
        structured_summary: buildSetterSummary({ score, checklist, interestTopics, closerDecision, decisionMakers }),
      })
      .select('*, user:profiles(full_name, role)')
      .single()

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    // Score immer aufs Lead schreiben
    await supabase.from('leads').update({ lead_score: score }).eq('id', lead.id)

    // ── Buchungs-Pfad: Closer-Termin via Booking Service ──
    if (closerDecision === 'yes' && closerSlot) {
      const res = await bookAppointment({
        supabase, leadId: lead.id, type: 'closer_call',
        assignedUserId: closerSlot.assignedUserId, bookedByUserId: profile.id, sourceRole: 'setter',
        startAt: closerSlot.startAt, endAt: closerSlot.endAt, durationMinutes: closerSlot.durationMinutes,
        contextNote: buildSetterSummary({ score, checklist, interestTopics, closerDecision, decisionMakers }),
        customerEmail: lead.email || null,
        attendees: decisionMakers.trim() ? [decisionMakers.trim()] : null,
      })
      setLoading(false)
      if (!res.ok) {
        toast({ title: 'Buchung fehlgeschlagen', description: res.message, variant: 'destructive' })
        if (res.code === 'slot_taken') setCloserSlot(null)
        return
      }
      toast({ title: '✓ Closer-Termin gebucht', description: `${closerSlot.assignedUserName} · Score ${score}` })
      onSuccess(newNote as CallNote)
      return
    }

    // ── No-Fit-Pfad ──
    await runCallNoteAutomations({
      supabase, lead, profile, role: 'Setter', result: callResult,
      rawNote: rawNote.trim(),
      score: score as any,
      decisionMakerStatus: checklist['decision_maker_confirmed'] ? 'Entscheider bestätigt' : 'Entscheider fehlt',
    })
    setLoading(false)
    toast({ title: '✗ Als No-Fit markiert', description: `${lead.company_name} — Score: ${score}` })
    onSuccess(newNote as CallNote)
  }

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-purple-700">
          <Phone className="h-4 w-4" /> Setter-Qualifizierung — {lead.company_name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Score — first and most important */}
          <div>
            <Label className="mb-2 block text-sm font-semibold">Lead-Bewertung *</Label>
            <div className="flex gap-2">
              {([
                { v: 'A', label: 'A — Top', color: 'border-green-400 bg-green-500 text-white' },
                { v: 'B', label: 'B — Gut', color: 'border-blue-400 bg-blue-500 text-white' },
                { v: 'C', label: 'C — Möglich', color: 'border-yellow-400 bg-yellow-400 text-white' },
                { v: 'No-Fit', label: 'No-Fit', color: 'border-red-400 bg-red-500 text-white' },
              ] as const).map(s => (
                <button
                  key={s.v}
                  type="button"
                  onClick={() => setScore(s.v)}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition-all ${
                    score === s.v ? s.color + ' ring-2 ring-offset-1 ring-current' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div>
            <Label className="mb-2 block text-sm font-semibold">Qualifizierungs-Checklist</Label>
            <div className="space-y-2">
              {SETTER_CHECKLIST.map(item => (
                <label key={item.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  checklist[item.id] ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={!!checklist[item.id]}
                    onChange={e => setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded"
                  />
                  <span className={`text-sm ${checklist[item.id] ? 'text-green-800 font-medium' : 'text-slate-700'}`}>
                    {item.label}
                  </span>
                  {checklist[item.id] && <CheckCircle className="h-4 w-4 text-green-500 ml-auto shrink-0" />}
                </label>
              ))}
            </div>
            {allChecksPassed && (
              <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Alle Punkte erfüllt — Closer-Freigabe möglich
              </p>
            )}
          </div>

          {/* Interest Topics */}
          <div>
            <Label className="mb-2 block text-sm font-semibold">Interesse an HK-Leistungen <span className="text-slate-400 font-normal">(mehrere möglich)</span></Label>
            <div className="flex flex-wrap gap-2">
              {HK_TOPICS.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    interestTopics.includes(topic)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-purple-300'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Decision Makers */}
          <div className="space-y-1.5">
            <Label>Wer muss beim Closer-Call dabei sein? *</Label>
            <Input
              placeholder="z.B. Geschäftsführer Herr Mayer + Marketing-Leiterin Frau Schulz"
              value={decisionMakers}
              onChange={e => setDecisionMakers(e.target.value)}
              className={checklist['decision_maker_confirmed'] ? 'border-green-300' : ''}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Setter-Notiz *</Label>
            <Textarea
              placeholder="Was hast du herausgefunden? Pain in eigenen Worten, Potenzial, was interessiert, warum passend oder nicht passend…"
              value={rawNote}
              onChange={e => setRawNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Closer Decision — the most important button */}
          <div>
            <Label className="mb-2 block text-sm font-semibold">Closer-Call-Entscheidung *</Label>
            {!canReleaseToCloser && score && (
              <div className="mb-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                {score === 'C' || score === 'No-Fit'
                  ? 'C / No-Fit — kein Closer-Call. Direkt auf Nicht passend setzen.'
                  : 'Checkliste noch nicht vollständig. Alle 4 Punkte müssen erfüllt sein.'}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCloserDecision('yes')}
                disabled={!canReleaseToCloser}
                className={`p-4 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                  closerDecision === 'yes'
                    ? 'border-green-500 bg-green-500 text-white ring-2 ring-green-300'
                    : canReleaseToCloser
                    ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                    : 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="h-5 w-5" />
                Ja — Closer-Call
              </button>
              <button
                type="button"
                onClick={() => setCloserDecision('no')}
                className={`p-4 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                  closerDecision === 'no'
                    ? 'border-red-500 bg-red-500 text-white ring-2 ring-red-300'
                    : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <XCircle className="h-5 w-5" />
                Nein — No-Fit
              </button>
            </div>
          </div>

          {/* Closer-Slot — nur bei Freigabe */}
          {closerDecision === 'yes' && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-purple-700">
                <CalendarClock className="h-4 w-4" /> Closer-Termin direkt buchen *
              </Label>
              <SlotPicker roleType="closer" selected={closerSlot} onSelect={setCloserSlot} />
              <p className="text-xs text-slate-500">Slot wählen → beim Speichern wird der Closer-Call atomar gebucht (Termin, Status, Briefing-Mail, Reminder).</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" size="lg" disabled={loading || (closerDecision === 'yes' && !closerSlot)} className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none">
              {loading ? <><Loader2 className="animate-spin h-4 w-4" /> Speichere…</> : closerDecision === 'yes' ? 'Closer-Termin buchen' : 'Qualifizierung speichern'}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>Abbrechen</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function buildSetterSummary({ score, checklist, interestTopics, closerDecision, decisionMakers }: any): string {
  const checks = SETTER_CHECKLIST.filter(c => checklist[c.id]).map(c => c.label)
  const missing = SETTER_CHECKLIST.filter(c => !checklist[c.id]).map(c => c.label)
  return [
    `Score: ${score}`,
    `Entscheidung: ${closerDecision === 'yes' ? 'Closer-Call freigegeben' : 'No-Fit'}`,
    interestTopics.length ? `Interesse: ${interestTopics.join(', ')}` : '',
    decisionMakers ? `Entscheider: ${decisionMakers}` : '',
    checks.length ? `✓ ${checks.join(' | ')}` : '',
    missing.length ? `✗ Fehlend: ${missing.join(' | ')}` : '',
  ].filter(Boolean).join('\n')
}

// ============================================================
// CLOSER FORM — Diagnose, Empfehlung, Outcome
// ============================================================

const CLOSER_OUTCOMES = [
  { value: 'Angebot vorbereiten', label: 'Angebot vorbereiten', color: 'border-teal-400 bg-teal-500 text-white' },
  { value: 'Angebot gesendet', label: 'Angebot gesendet', color: 'border-lime-400 bg-lime-500 text-white' },
  { value: 'Follow-up', label: 'Follow-up nötig', color: 'border-amber-400 bg-amber-400 text-white' },
  { value: 'Gewonnen', label: '🎉 Gewonnen', color: 'border-green-500 bg-green-600 text-white' },
  { value: 'Verloren', label: 'Verloren / No-Go', color: 'border-red-400 bg-red-500 text-white' },
] as const

function CloserNoteForm({ lead, profile, onSuccess, onCancel }: Props) {
  const [outcome, setOutcome] = useState<string>('')
  const [diagnosis, setDiagnosis] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [objections, setObjections] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!diagnosis.trim()) {
      toast({ title: 'Diagnose fehlt', description: 'Was war der Hauptengpass?', variant: 'destructive' })
      return
    }
    if (!outcome) {
      toast({ title: 'Outcome fehlt', description: 'Was ist der nächste Schritt?', variant: 'destructive' })
      return
    }
    setLoading(true)
    const supabase = createClient()

    const rawNote = [
      diagnosis && `Diagnose: ${diagnosis}`,
      recommendation && `Empfehlung: ${recommendation}`,
      nextStep && `Nächster Schritt: ${nextStep}`,
      objections && `Einwände: ${objections}`,
    ].filter(Boolean).join('\n')

    const callResult = outcome as CallResult

    const { data: newNote, error } = await supabase
      .from('call_notes')
      .insert({
        lead_id: lead.id,
        user_id: profile.id,
        role_context: 'Closer',
        call_result: callResult,
        raw_note: rawNote,
        next_step: nextStep.trim() || null,
        objections: objections.trim() ? objections.split(',').map(o => o.trim()).filter(Boolean) : null,
        structured_summary: `Outcome: ${outcome}\n${rawNote}`,
      })
      .select('*, user:profiles(full_name, role)')
      .single()

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    const auto = await runCallNoteAutomations({
      supabase, lead, profile, role: 'Closer', result: callResult,
      rawNote, nextStep: nextStep.trim() || null,
    })

    toast({
      title: 'Closer-Notiz gespeichert!',
      description: `→ ${outcome}${auto.followupCreated ? ' · Follow-up gesetzt' : ''}`,
    })
    onSuccess(newNote as CallNote)
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-blue-700">
          <Phone className="h-4 w-4" /> Closer-Call Nachbereitung — {lead.company_name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Outcome — primary decision */}
          <div>
            <Label className="mb-2 block text-sm font-semibold">Ergebnis des Calls *</Label>
            <div className="grid grid-cols-3 gap-2">
              {CLOSER_OUTCOMES.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOutcome(o.value)}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    outcome === o.value
                      ? o.color + ' ring-2 ring-offset-1 ring-current'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnosis */}
          <div className="space-y-1.5">
            <Label>Diagnose — Was ist der Hauptengpass? *</Label>
            <Textarea
              placeholder="Was ist das eigentliche Problem des Unternehmens? Was kostet es sie aktuell?"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Recommendation */}
          <div className="space-y-1.5">
            <Label>Empfehlung — Was ist der konkrete HK-Ansatz?</Label>
            <Textarea
              placeholder="Welche Leistung haben wir empfohlen? Welcher Ansatz passt?"
              value={recommendation}
              onChange={e => setRecommendation(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Next Step */}
          <div className="space-y-1.5">
            <Label>Nächster konkreter Schritt</Label>
            <Input
              placeholder="z.B. Angebot bis Freitag schicken / Follow-up-Call in 2 Wochen"
              value={nextStep}
              onChange={e => setNextStep(e.target.value)}
            />
          </div>

          {/* Objections */}
          <div className="space-y-1.5">
            <Label>Einwände / Bedenken <span className="text-slate-400 font-normal">(kommagetrennt)</span></Label>
            <Input
              placeholder="z.B. Budget unklar, will erst intern besprechen"
              value={objections}
              onChange={e => setObjections(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" size="lg" disabled={loading} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
              {loading ? <><Loader2 className="animate-spin h-4 w-4" /> Speichere…</> : 'Nachbereitung speichern'}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>Abbrechen</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
