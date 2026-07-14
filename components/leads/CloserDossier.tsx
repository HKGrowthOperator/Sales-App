'use client'

import { Lead, CallNote } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, getEntryAngleEmoji } from '@/lib/utils'
import { ScoreBadge } from '@/components/shared/StatusBadge'
import {
  Globe, Instagram, Linkedin, Phone, Mail, Target,
  FileText, AlertCircle, Lightbulb, CheckCircle2,
  ExternalLink, XCircle, AlertTriangle
} from 'lucide-react'

interface Props {
  lead: Lead
  openerNote: CallNote | undefined
  setterNote: CallNote | undefined
}

export function CloserDossier({ lead, openerNote, setterNote }: Props) {
  const hkHebel = getHKHebel(lead.entry_angle)
  const callGoal = getCallGoal(lead, openerNote, setterNote)
  const openQuestions = getOpenQuestions(lead, openerNote, setterNote)

  const decisionMakerConfirmed = lead.decision_maker_status === 'Entscheider bestätigt'
  const decisionMakerWarning = !lead.decision_maker_status || lead.decision_maker_status === 'Noch nicht klar' || lead.decision_maker_status === 'Entscheider fehlt'

  // Interest topics from setter note
  const interestTopics = (setterNote as any)?.interest_topics as string[] | null

  return (
    <div className="space-y-4">

      {/* 1. CALL GOAL — always first */}
      <Card className={`border-2 ${openQuestions.some(q => q.isWarning) ? 'border-amber-300 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
        <CardContent className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Gesprächsziel</p>
          <p className="font-semibold text-slate-900 text-base">{callGoal}</p>
          {openQuestions.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {openQuestions.map((q, i) => (
                <li key={i} className={`text-sm flex items-start gap-2 ${q.isWarning ? 'text-amber-800' : 'text-slate-700'}`}>
                  {q.isWarning
                    ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    : <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                  }
                  {q.text}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 2. HEADER — company + links */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">CLOSER-DOSSIER</p>
              <h2 className="text-xl font-bold">{lead.company_name}</h2>
              {lead.contact_name && (
                <p className="text-slate-300 mt-0.5">{lead.contact_name}{lead.role_title ? ` · ${lead.role_title}` : ''}</p>
              )}
              {lead.industry && (
                <p className="text-slate-400 text-sm mt-0.5">Branche: {lead.industry}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <ScoreBadge score={lead.lead_score} />
              {lead.appointment_at && (
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Termin</p>
                  <p className="text-white font-semibold text-sm">{formatDateTime(lead.appointment_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-2 flex-wrap">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors">
                <Phone className="h-3.5 w-3.5" /> {lead.phone}
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors">
                <Mail className="h-3.5 w-3.5" /> {lead.email}
              </a>
            )}
            {lead.website && (
              <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors">
                <Globe className="h-3.5 w-3.5" /> Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {lead.instagram && (
              <a href={`https://${lead.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors">
                <Instagram className="h-3.5 w-3.5" /> IG <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {lead.linkedin && (
              <a href={`https://${lead.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition-colors">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. PAIN — large and prominent */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> Hauptproblem / Pain
          </p>
          <p className="text-slate-800 text-base font-medium leading-relaxed">
            {lead.pain_guess || <span className="text-slate-400 italic font-normal">Noch nicht erfasst</span>}
          </p>
        </CardContent>
      </Card>

      {/* 3b. RADAR-DIAGNOSE — Closer-Kontext + Befund aus dem Lead Radar */}
      {(lead.closer_context || lead.radar_analysis) && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-2">🛰 Radar-Diagnose</p>
            {lead.closer_context && (
              <p className="text-sm text-slate-800 leading-relaxed">{lead.closer_context}</p>
            )}
            {lead.radar_analysis && (
              <div className="mt-2 bg-white rounded-lg border border-violet-100 p-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Befund</p>
                <p className="text-xs text-slate-600 whitespace-pre-line">{lead.radar_analysis}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. KEY INFO — 3 column */}
      <div className="grid sm:grid-cols-3 gap-3">
        {/* HK Hebel */}
        <Card className="border-blue-100">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 flex items-center gap-1">
              <Target className="h-3.5 w-3.5" /> HK-Hebel
            </p>
            {lead.entry_angle ? (
              <>
                <p className="font-bold text-blue-700">{getEntryAngleEmoji(lead.entry_angle)} {lead.entry_angle}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{hkHebel}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400 italic">Noch definieren</p>
            )}
          </CardContent>
        </Card>

        {/* Interest Topics from Setter */}
        <Card className="border-purple-100">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Interesse an</p>
            {interestTopics && interestTopics.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {interestTopics.map((t, i) => (
                  <span key={i} className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 font-medium">{t}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Nicht erfasst</p>
            )}
          </CardContent>
        </Card>

        {/* Entscheider */}
        <Card className={`${decisionMakerWarning ? 'border-amber-200 bg-amber-50' : 'border-green-100'}`}>
          <CardContent className="p-4">
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${decisionMakerWarning ? 'text-amber-600' : 'text-green-600'}`}>
              {decisionMakerWarning ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Entscheider
            </p>
            <p className={`text-sm font-semibold ${decisionMakerWarning ? 'text-amber-800' : 'text-green-800'}`}>
              {lead.decision_maker_status || 'Nicht geprüft!'}
            </p>
            {setterNote?.decision_makers_needed && (
              <p className="text-xs text-slate-600 mt-1">Im Call: {setterNote.decision_makers_needed}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. NOTES — Opener + Setter side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Opener Note */}
        <Card className="border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
              <FileText className="h-4 w-4" /> Opener-Notiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openerNote ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-700 leading-relaxed">{openerNote.raw_note}</p>
                {openerNote.call_result && (
                  <span className="inline-block text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5">
                    {openerNote.call_result}
                  </span>
                )}
                {openerNote.objections && openerNote.objections.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Einwände:</p>
                    <div className="flex gap-1 flex-wrap">
                      {openerNote.objections.map((obj, i) => (
                        <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-100 rounded px-1.5 py-0.5">{obj}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Keine Opener-Notiz vorhanden</p>
            )}
          </CardContent>
        </Card>

        {/* Setter Note */}
        <Card className="border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
              <FileText className="h-4 w-4" /> Setter-Qualifizierung
            </CardTitle>
          </CardHeader>
          <CardContent>
            {setterNote ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-700 leading-relaxed">{setterNote.raw_note}</p>
                {setterNote.structured_summary && (
                  <div className="bg-purple-50 rounded-lg p-2 border border-purple-100">
                    <p className="text-xs text-purple-700 whitespace-pre-line leading-relaxed">{setterNote.structured_summary}</p>
                  </div>
                )}
                {setterNote.next_step && (
                  <p className="text-xs text-slate-500">→ {setterNote.next_step}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Keine Setter-Qualifizierung vorhanden</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getHKHebel(angle: string | null | undefined): string {
  const hebel: Record<string, string> = {
    'Website': 'Neue, conversion-optimierte Website mit klarer Botschaft und Lead-Funnel',
    'Social Media': 'Content-Strategie für Instagram/LinkedIn — mehr Anfragen durch Sichtbarkeit',
    'Anfragen': 'SEO, Google Ads oder lokale Präsenz für konstanten Anfragenstrom',
    'Außenwirkung': 'Brand-Strategie, Design-System und einheitliche Außendarstellung',
    'KI-Zeitersparnis': 'KI-Automatisierung für Angebote, Nachfass und interne Abläufe',
    'Recruiting': 'Employer Branding, Karriereseite, Social-Media-Recruiting',
  }
  return angle ? (hebel[angle] || 'Maßgeschneiderte Lösung') : 'Noch zu definieren'
}

function getCallGoal(lead: Lead, openerNote?: CallNote, setterNote?: CallNote): string {
  if (lead.status === 'Angebot gesendet') {
    return `Angebot bei ${lead.company_name} nachfassen — Einwände klären, Entscheidung herbeiführen.`
  }
  if (lead.status === 'Follow-up') {
    return `Follow-up mit ${lead.company_name} — Stand klären, nächsten Schritt definieren.`
  }
  return `Engpass bei ${lead.company_name} diagnostizieren. Konkrete Empfehlung geben. Nächsten Schritt einleiten.`
}

interface OpenQuestion {
  text: string
  isWarning: boolean
}

function getOpenQuestions(lead: Lead, openerNote?: CallNote, setterNote?: CallNote): OpenQuestion[] {
  const questions: OpenQuestion[] = []

  if (!lead.decision_maker_status || lead.decision_maker_status === 'Noch nicht klar' || lead.decision_maker_status === 'Entscheider fehlt') {
    questions.push({ text: 'ACHTUNG: Entscheider-Status unklar — zu Beginn klären, ob alle Entscheider dabei sind!', isWarning: true })
  }
  if (openerNote?.objections && openerNote.objections.length > 0) {
    questions.push({ text: `Einwände aus Opener aktiv ansprechen: ${openerNote.objections.join(', ')}`, isWarning: false })
  }
  if (!lead.entry_angle) {
    questions.push({ text: 'Welcher HK-Hebel ist am relevantesten? Offen im Call herausfinden.', isWarning: false })
  }
  if (lead.status !== 'Angebot gesendet' && lead.status !== 'Follow-up') {
    questions.push({ text: 'Was wäre der konkrete Wert, wenn dieses Problem in 6 Monaten gelöst ist?', isWarning: false })
  }
  if (!setterNote) {
    questions.push({ text: 'Keine Setter-Notiz vorhanden — extra Zeit für Diagnose einplanen.', isWarning: true })
  }

  return questions
}
