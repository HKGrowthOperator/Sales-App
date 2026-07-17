'use client'

import { useState } from 'react'
import { Lead, Profile, Script, ObjectionHandling, ObjectionItem, SITUATION_LABELS } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChevronDown, ChevronUp, Copy, Check,
  Target, MessageSquare, HelpCircle, ArrowRight, Flag, BookOpen, AlertTriangle,
  Mic, ListChecks, Cog, PenLine
} from 'lucide-react'
import { renderMarkup, ColorLegend, stripMarkup, SCRIPT_FONT } from '@/components/shared/ScriptMarkup'

interface Props {
  script: Script | null
  lead: Lead
  profile: Profile
  objections?: ObjectionItem[]
}

export function ScriptPanel({ script, lead, profile, objections = [] }: Props) {
  const [fullScriptOpen, setFullScriptOpen] = useState(false)
  const [expandedObjection, setExpandedObjection] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  // Name des eingeloggten Nutzers (Anrufer) — Closer = Luis/Nick, Opener/Setter = jeweilige Person
  const callerName = (profile.full_name || '').trim() || 'HK Growth'

  if (!script) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-slate-400">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="font-medium text-slate-500">Kein Skript gefunden</p>
        <p className="text-sm mt-1">
          {profile.role === 'admin'
            ? 'Erstelle ein Skript unter Skripte.'
            : 'Admin muss ein passendes Skript anlegen.'}
        </p>
      </div>
    )
  }

  function personalize(text: string | null | undefined): string {
    if (!text) return ''
    return text
      // Anrufer = eingeloggter Nutzer
      .replaceAll('[ICH]', callerName)
      .replaceAll('[OPENER-NAME]', callerName)
      .replaceAll('[SETTER-NAME]', callerName)
      .replaceAll('[Luis/Nick]', callerName)
      .replaceAll('[NAME-ANRUFER]', callerName)
      // Lead / Ansprechpartner
      .replaceAll('[KONTAKTNAME]', lead.contact_name || 'Ansprechpartner')
      .replaceAll('[Name]', lead.contact_name || 'Ansprechpartner')
      .replaceAll('[Kontaktname]', lead.contact_name || 'Ansprechpartner')
      .replaceAll('[E-Mail]', lead.email || '[E-Mail]')
      .replaceAll('[UNTERNEHMEN]', lead.company_name)
      .replaceAll('[BRANCHE]', lead.industry || 'Ihrer Branche')
      .replaceAll('[PAIN]', lead.pain_guess || 'Ihrem größten Engpass')
      .replaceAll('[STADT]', (() => {
        // Versuche Stadt aus last_note zu lesen (Format: "Stadt | Adresse | ...")
        const fromNote = (lead as any).last_note?.split('|')[0]?.trim()
        // Fallback: aus Adresse in pain_guess oder industry ableiten
        if (fromNote && fromNote.length < 30) return fromNote
        // Fallback: leer lassen statt kaputten Platzhalter zeigen
        return ''
      })())
  }

  function copyScript() {
    if (!script) return
    const parts = [
      script.call_goal      && `CALL-ZIEL:\n${script.call_goal}`,
      script.opening_line   && `\nEINSTIEG:\n${personalize(script.opening_line)}`,
      script.relevance_line && `\nWARUM SIE JETZT:\n${personalize(script.relevance_line)}`,
      script.core_question  && `\nKERNFRAGE:\n${personalize(script.core_question)}`,
      script.mechanism      && `\nMECHANISMUS:\n${personalize(script.mechanism)}`,
      script.main_body      && `\nHAUPTTEIL:\n${personalize(script.main_body)}`,
      script.transition_line && `\nÜBERGANG:\n${personalize(script.transition_line)}`,
      script.closing_line   && `\nABSCHLUSS:\n${personalize(script.closing_line)}`,
    ].filter(Boolean).map(t => stripMarkup(t as string)).join('\n')
    navigator.clipboard.writeText(parts)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Einwände: bevorzugt aus der Library (rollen-/winkelgefiltert), sonst Legacy-Inline
  const libraryObjections: ObjectionHandling[] = (objections || [])
    .filter(o => o.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(o => ({ objection: o.objection_label, response: o.response }))
  const inlineObjections: ObjectionHandling[] = Array.isArray(script.objection_handling)
    ? script.objection_handling
    : []
  const objectionList: ObjectionHandling[] = libraryObjections.length > 0 ? libraryObjections : inlineObjections

  const isPersonal = script.script_type === 'personal'
  const situationLabel = script.situation ? SITUATION_LABELS[script.situation] : null

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isPersonal
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {isPersonal ? '✓ Meine Version' : 'Master-Skript'}
          </span>
          {situationLabel && (
            <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
              {situationLabel}
            </span>
          )}
          <span className="text-xs text-slate-400">{script.title}</span>
        </div>
        <Button variant="outline" size="sm" onClick={copyScript} className="shrink-0">
          {copied
            ? <><Check className="h-3.5 w-3.5 text-green-600 mr-1" /> Kopiert</>
            : <><Copy className="h-3.5 w-3.5 mr-1" /> Kopieren</>
          }
        </Button>
      </div>

      {/* Call Goal — immer zuerst und prominent */}
      {script.call_goal && (
        <div className="rounded-xl bg-blue-600 text-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-blue-200" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Call-Ziel</span>
          </div>
          <p className="font-semibold text-base leading-snug">{script.call_goal}</p>
        </div>
      )}

      {/* Tone Guidance — WIE es gesagt wird */}
      {script.tone_guidance && (
        <div className="rounded-xl bg-slate-900 text-slate-100 p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Mic className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tonalität</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-200">{script.tone_guidance}</p>
        </div>
      )}

      {/* Opening Line */}
      {script.opening_line && (
        <ScriptBlock
          icon={<MessageSquare className="h-3.5 w-3.5 text-orange-500" />}
          label="Einstieg"
          labelColor="text-orange-600"
          bgColor="bg-orange-50 border-orange-100"
          text={personalize(script.opening_line)}
        />
      )}

      {/* Relevance Line — warum dieser Lead jetzt */}
      {script.relevance_line && (
        <ScriptBlock
          icon={<Flag className="h-3.5 w-3.5 text-yellow-500" />}
          label="Warum jetzt"
          labelColor="text-yellow-700"
          bgColor="bg-yellow-50 border-yellow-100"
          text={personalize(script.relevance_line)}
        />
      )}

      {/* Core Question */}
      {script.core_question && (
        <ScriptBlock
          icon={<HelpCircle className="h-3.5 w-3.5 text-purple-500" />}
          label="Kernfrage (Methodenfrage)"
          labelColor="text-purple-700"
          bgColor="bg-purple-50 border-purple-100"
          text={personalize(script.core_question)}
          highlight
        />
      )}

      {/* Mechanismus — Korthauer: erklären, ohne zu viel zu erklären */}
      {script.mechanism && (
        <ScriptBlock
          icon={<Cog className="h-3.5 w-3.5 text-cyan-600" />}
          label={'Mechanismus (wenn „Was ist das?")'}
          labelColor="text-cyan-700"
          bgColor="bg-cyan-50 border-cyan-100"
          text={personalize(script.mechanism)}
        />
      )}

      {/* Main Body — nur wenn keine neuen Felder */}
      {script.main_body && !script.core_question && !script.relevance_line && (
        <ScriptBlock
          icon={<BookOpen className="h-3.5 w-3.5 text-slate-400" />}
          label="Hauptteil"
          labelColor="text-slate-500"
          bgColor="bg-slate-50 border-slate-100"
          text={personalize(script.main_body)}
        />
      )}

      {/* Transition Line */}
      {script.transition_line && (
        <ScriptBlock
          icon={<ArrowRight className="h-3.5 w-3.5 text-green-500" />}
          label="Übergang / Nächster Schritt"
          labelColor="text-green-700"
          bgColor="bg-green-50 border-green-100"
          text={personalize(script.transition_line)}
        />
      )}

      {/* Closing Line — nur wenn kein transition_line */}
      {script.closing_line && !script.transition_line && (
        <ScriptBlock
          icon={<ArrowRight className="h-3.5 w-3.5 text-green-500" />}
          label="Abschluss"
          labelColor="text-green-700"
          bgColor="bg-green-50 border-green-100"
          text={personalize(script.closing_line)}
        />
      )}

      {/* Qualifizierungsfragen */}
      {Array.isArray(script.qualifying_questions_json) && script.qualifying_questions_json.length > 0 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            <ListChecks className="h-3.5 w-3.5 text-indigo-500" /> Qualifizierungsfragen
          </div>
          <ol className="space-y-1.5">
            {script.qualifying_questions_json.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-800 leading-relaxed">
                <span className="font-bold text-indigo-400 shrink-0">{i + 1}.</span>
                <span>{personalize(q)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Notiz-Checkliste — hält die Kette Skript → Notizen → Automation intakt */}
      {Array.isArray(script.required_notes_json) && script.required_notes_json.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <PenLine className="h-3.5 w-3.5" /> Im Call notieren
          </div>
          <ul className="space-y-1">
            {script.required_notes_json.map((n, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600 leading-relaxed">
                <span className="text-slate-300">▢</span><span>{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full Script — einklappbar, farbcodiert, ruhige Lesbarkeit (Serif) */}
      {script.full_script && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 transition-colors"
            onClick={() => setFullScriptOpen(!fullScriptOpen)}
          >
            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Vollständiges Skript
            </span>
            {fullScriptOpen
              ? <ChevronUp className="h-4 w-4 text-slate-400" />
              : <ChevronDown className="h-4 w-4 text-slate-400" />
            }
          </button>
          {fullScriptOpen && (
            <div className="px-4 py-3 bg-white space-y-3">
              <ColorLegend />
              <p className="text-[15px] text-slate-800 leading-[1.75] whitespace-pre-line" style={SCRIPT_FONT}>
                {renderMarkup(personalize(script.full_script))}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Objections */}
      {objectionList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">
              Einwandbehandlung ({objectionList.length})
            </span>
          </div>
          <div className="space-y-1.5">
            {objectionList.map((obj, i) => (
              <div key={i} className="border border-red-100 rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-red-50 transition-colors"
                  onClick={() => setExpandedObjection(expandedObjection === i ? null : i)}
                >
                  <span className="text-sm font-medium text-slate-800">„{obj.objection}"</span>
                  {expandedObjection === i
                    ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                    : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                  }
                </button>
                {expandedObjection === i && (
                  <div className="px-3 pb-3 pt-1 bg-green-50 border-t border-green-100">
                    <p className="text-sm text-slate-700 leading-relaxed" style={SCRIPT_FONT}>{renderMarkup(personalize(obj.response))}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Reusable Script Block ────────────────────────────────────────────────────

function ScriptBlock({
  icon, label, labelColor, bgColor, text, highlight = false
}: {
  icon: React.ReactNode
  label: string
  labelColor: string
  bgColor: string
  text: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${bgColor} ${highlight ? 'ring-2 ring-purple-200' : ''}`}>
      <div className={`flex items-center gap-1.5 mb-2 text-xs font-bold uppercase tracking-wider ${labelColor}`}>
        {icon} {label}
      </div>
      <p className={`text-[15px] text-slate-800 leading-[1.7] whitespace-pre-line ${highlight ? 'font-medium' : ''}`} style={SCRIPT_FONT}>
        {renderMarkup(text)}
      </p>
    </div>
  )
}
