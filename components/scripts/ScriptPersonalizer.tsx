'use client'

import { useState, useRef } from 'react'
import { Script, Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/hooks/use-toast'
import { Mic, Square, Play, Loader2, Send, Save, X, BookOpen } from 'lucide-react'

interface Props {
  master: Script
  existing: Script | null   // bestehende persönliche Version dieses Users (falls vorhanden)
  profile: Profile
  onClose: () => void
  onSaved: () => void
}

// Felder, die der Mitarbeiter in eigene Worte umschreibt (die gesprochenen Teile)
const FIELDS: { key: keyof Script; label: string; rows: number }[] = [
  { key: 'opening_line',    label: 'Einstieg (Begrüßung + Vorbezug)', rows: 4 },
  { key: 'relevance_line',  label: 'Relevanz / Aufhänger',            rows: 4 },
  { key: 'core_question',   label: 'Kernfrage',                        rows: 2 },
  { key: 'transition_line', label: 'Übergang / nächster Schritt',      rows: 3 },
]

export function ScriptPersonalizer({ master, existing, profile, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const base = existing || master
    return {
      opening_line: base.opening_line || '',
      relevance_line: base.relevance_line || '',
      core_question: base.core_question || '',
      transition_line: base.transition_line || '',
    }
  })
  const [loading, setLoading] = useState(false)

  // ── In-Browser-Aufnahme (nur zum Selbst-Anhören, wird nicht gespeichert) ──
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
    } catch {
      toast({ title: 'Mikrofon nicht verfügbar', description: 'Bitte Mikrofon-Zugriff erlauben.', variant: 'destructive' })
    }
  }
  function stopRecording() {
    mediaRef.current?.stop()
    setRecording(false)
  }

  async function save(submit: boolean) {
    setLoading(true)
    const supabase = createClient()
    const payload: Record<string, any> = {
      script_type: 'personal',
      parent_script_id: master.id,
      owner_user_id: profile.id,
      role: master.role,
      entry_angle: master.entry_angle,
      situation: master.situation,
      industry: master.industry,
      title: master.title.replace(/ \(Meine Version\)$/, '') + ' (Meine Version)',
      // editierte gesprochene Teile
      opening_line: values.opening_line,
      relevance_line: values.relevance_line,
      core_question: values.core_question,
      transition_line: values.transition_line,
      closing_line: values.transition_line,
      // Rahmen aus dem Master übernehmen (Panel bleibt vollständig)
      call_goal: master.call_goal,
      tone_guidance: master.tone_guidance,
      positioning: master.positioning,
      method_name: master.method_name,
      main_body: master.main_body,
      qualifying_questions_json: master.qualifying_questions_json ?? [],
      required_notes_json: master.required_notes_json ?? [],
      status: submit ? 'pending_review' : 'draft',
      version: master.version,
      is_active: true,
    }

    let error
    if (existing) {
      ({ error } = await supabase.from('scripts').update(payload).eq('id', existing.id))
    } else {
      ({ error } = await supabase.from('scripts').insert(payload))
    }

    setLoading(false)
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' })
      return
    }
    toast({
      title: submit ? 'Zur Freigabe eingereicht' : 'Entwurf gespeichert',
      description: submit ? 'Admin prüft deine Version.' : 'Du kannst später weiterarbeiten.',
    })
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Meine Version erstellen</h2>
            <p className="text-sm text-slate-500">{master.title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Anleitung */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-slate-700 space-y-1.5">
            <p className="font-semibold text-blue-800">So entsteht Authentizität — nicht „Vortrag":</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>Lies das HK-Master-Skript einmal <strong>laut</strong> vor.</li>
              <li>Nimm dich dabei auf (Button unten) und <strong>hör es dir an</strong>.</li>
              <li>Schreib die Sätze unten so um, wie <strong>du</strong> sie natürlich sagen würdest.</li>
              <li>Reiche deine Version zur Freigabe ein — danach erscheint sie im Call statt des Masters.</li>
            </ol>
          </div>

          {/* Recorder */}
          <div className="rounded-xl border border-slate-200 p-4 flex items-center gap-3 flex-wrap">
            {!recording ? (
              <Button type="button" variant="outline" onClick={startRecording} className="gap-2">
                <Mic className="h-4 w-4 text-red-500" /> Aufnahme starten
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={stopRecording} className="gap-2 border-red-300">
                <Square className="h-4 w-4 text-red-500 animate-pulse" /> Aufnahme stoppen
              </Button>
            )}
            {audioUrl && <audio controls src={audioUrl} className="h-9" />}
            <span className="text-xs text-slate-400">Aufnahme bleibt nur lokal (wird nicht gespeichert).</span>
          </div>

          {/* Felder: Master-Referenz + eigene Version */}
          {FIELDS.map(f => (
            <div key={f.key as string} className="space-y-2">
              <Label className="text-sm font-semibold">{f.label}</Label>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-500">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  <BookOpen className="h-3 w-3" /> HK-Master (Referenz)
                </div>
                {(master[f.key] as string) || '—'}
              </div>
              <Textarea
                value={values[f.key as string]}
                onChange={e => setValues(v => ({ ...v, [f.key as string]: e.target.value }))}
                rows={f.rows}
                placeholder="In deinen eigenen Worten…"
                className="resize-none"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t sticky bottom-0 bg-white rounded-b-2xl">
          <Button variant="outline" onClick={() => save(false)} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Entwurf
          </Button>
          <Button onClick={() => save(true)} disabled={loading} className="gap-2 bg-green-600 hover:bg-green-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Zur Freigabe einreichen
          </Button>
        </div>
      </div>
    </div>
  )
}
