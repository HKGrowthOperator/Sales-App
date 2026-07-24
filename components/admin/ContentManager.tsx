'use client'

import { useState } from 'react'
import { Script, ObjectionItem, RoleContext } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/lib/hooks/use-toast'
import { FileText, MessageSquareWarning, Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

// ============================================================
// Admin: Skripte & Einwände anlegen/bearbeiten (Content-Verwaltung)
// Skripte/Einwände hängen an der ROLLE (Opener/Setter/Closer).
// Platzhalter im Text werden im Call automatisch personalisiert.
// ============================================================

const ROLES: RoleContext[] = ['Opener', 'Setter', 'Closer']
const ENTRY_ANGLES = ['', 'Außenwirkung', 'Website', 'Social Media', 'Anfragen', 'KI-Zeitersparnis', 'Recruiting', 'Automationen & CRM', 'Komplettangebot']

const PLACEHOLDERS = '[KONTAKTNAME] · [UNTERNEHMEN] · [BRANCHE] · [STADT] · [PAIN] · [ANLASS] · [STELLE] · [WEBSITE] · [ENTSCHEIDER] · [ICH]'

const emptyScript = {
  id: '', role: 'Opener' as RoleContext, entry_angle: '', title: '',
  positioning: '', opening_line: '', relevance_line: '', core_question: '',
  transition_line: '', call_goal: '', full_script: '', tone_guidance: '', qualifying_questions_json: '',
}

interface Props {
  initialScripts: Script[]
  initialObjections: ObjectionItem[]
}

export function ContentManager({ initialScripts, initialObjections }: Props) {
  const [scripts, setScripts] = useState<Script[]>(initialScripts)
  const [objections, setObjections] = useState<ObjectionItem[]>(initialObjections)

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Skripte &amp; Einwände</h1>
        <p className="text-sm text-slate-500">
          Inhalte je Rolle pflegen. Platzhalter werden im Call automatisch ersetzt:
          <span className="font-mono text-xs text-slate-400 block mt-0.5">{PLACEHOLDERS}</span>
        </p>
      </div>

      <Tabs defaultValue="scripts">
        <TabsList>
          <TabsTrigger value="scripts"><FileText className="h-4 w-4 mr-1" /> Skripte ({scripts.length})</TabsTrigger>
          <TabsTrigger value="objections"><MessageSquareWarning className="h-4 w-4 mr-1" /> Einwände ({objections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="scripts">
          <ScriptsTab scripts={scripts} setScripts={setScripts} />
        </TabsContent>
        <TabsContent value="objections">
          <ObjectionsTab objections={objections} setObjections={setObjections} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------- Skripte ----------
function ScriptsTab({ scripts, setScripts }: { scripts: Script[]; setScripts: (s: Script[]) => void }) {
  const [form, setForm] = useState<typeof emptyScript>({ ...emptyScript })
  const [saving, setSaving] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const upd = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    if (!form.title.trim()) { toast({ title: 'Titel fehlt', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/scripts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', script: form }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { toast({ title: 'Fehler', description: data.error || `HTTP ${res.status}`, variant: 'destructive' }); return }
      setScripts(form.id ? scripts.map(s => s.id === data.script.id ? data.script : s) : [data.script, ...scripts])
      toast({ title: form.id ? 'Skript aktualisiert' : 'Skript angelegt', description: data.script.title })
      setForm({ ...emptyScript })
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Skript löschen?')) return
    const res = await fetch('/api/admin/scripts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) })
    if (res.ok) { setScripts(scripts.filter(s => s.id !== id)); toast({ title: 'Gelöscht' }) }
  }

  function edit(s: Script) {
    setForm({
      id: s.id, role: s.role, entry_angle: s.entry_angle || '', title: s.title || '',
      positioning: s.positioning || '', opening_line: s.opening_line || '', relevance_line: s.relevance_line || '',
      core_question: s.core_question || '', transition_line: s.transition_line || '', call_goal: s.call_goal || '',
      full_script: s.full_script || '', tone_guidance: s.tone_guidance || '',
      qualifying_questions_json: (s.qualifying_questions_json || []).join('\n'),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">{form.id ? 'Skript bearbeiten' : 'Neues Master-Skript'}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Rolle *</Label>
              <Select value={form.role} onValueChange={v => upd('role', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Einstiegspunkt (optional)</Label>
              <Select value={form.entry_angle} onValueChange={v => upd('entry_angle', v)}>
                <SelectTrigger><SelectValue placeholder="alle" /></SelectTrigger>
                <SelectContent>{ENTRY_ANGLES.map(a => <SelectItem key={a || 'all'} value={a || 'all'}>{a || 'alle Winkel'}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Titel *</Label>
              <Input value={form.title} onChange={e => upd('title', e.target.value)} placeholder="z.B. Opener Kaltakquise" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Positionierung" v={form.positioning} on={v => upd('positioning', v)} rows={2} />
            <Field label="Call-Ziel" v={form.call_goal} on={v => upd('call_goal', v)} rows={2} />
          </div>
          <Field label="Einstieg / Begrüßung" v={form.opening_line} on={v => upd('opening_line', v)} rows={2} />
          <Field label="Relevanz / Aufhänger" v={form.relevance_line} on={v => upd('relevance_line', v)} rows={2} />
          <Field label="Kernfrage" v={form.core_question} on={v => upd('core_question', v)} rows={2} />
          <Field label="Übergang / nächster Schritt" v={form.transition_line} on={v => upd('transition_line', v)} rows={2} />
          <Field label="Qualifizierungsfragen (eine pro Zeile)" v={form.qualifying_questions_json} on={v => upd('qualifying_questions_json', v)} rows={3} />
          <Field label="Vollständiges Skript (mit Betonungen/Formatierung)" v={form.full_script} on={v => upd('full_script', v)} rows={8} mono />
          <Field label="Ton / Sprechhinweise" v={form.tone_guidance} on={v => upd('tone_guidance', v)} rows={2} />
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {form.id ? 'Speichern' : 'Skript anlegen'}
            </Button>
            {form.id && <Button variant="outline" onClick={() => setForm({ ...emptyScript })}>Neu / Abbrechen</Button>}
          </div>
        </CardContent>
      </Card>

      {ROLES.map(role => {
        const list = scripts.filter(s => s.role === role)
        if (!list.length) return null
        return (
          <div key={role}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{role} ({list.length})</p>
            <div className="space-y-2">
              {list.map(s => (
                <Card key={s.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setOpenId(openId === s.id ? null : s.id)} className="flex-1 flex items-center gap-2 text-left">
                        {openId === s.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        <span className="font-medium text-slate-800">{s.title}</span>
                        {s.entry_angle && <span className="text-xs text-slate-400">· {s.entry_angle}</span>}
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => edit(s)}>Bearbeiten</Button>
                      <Button variant="ghost" size="sm" onClick={() => del(s.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    {openId === s.id && (
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-600 bg-slate-50 rounded p-2 max-h-64 overflow-y-auto">{s.full_script || [s.opening_line, s.relevance_line, s.core_question, s.transition_line].filter(Boolean).join('\n\n')}</pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Einwände ----------
function ObjectionsTab({ objections, setObjections }: { objections: ObjectionItem[]; setObjections: (o: ObjectionItem[]) => void }) {
  const [role, setRole] = useState<string>('Opener')
  const [label, setLabel] = useState('')
  const [response, setResponse] = useState('')
  const [psych, setPsych] = useState('')
  const [bulk, setBulk] = useState('')
  const [saving, setSaving] = useState(false)

  async function addOne() {
    if (!label.trim() || !response.trim()) { toast({ title: 'Einwand + Antwort nötig', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/objections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', objection: { role, objection_label: label, response, psychology_note: psych } }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { toast({ title: 'Fehler', description: data.error, variant: 'destructive' }); return }
      setObjections([data.objection, ...objections])
      toast({ title: 'Einwand angelegt' }); setLabel(''); setResponse(''); setPsych('')
    } finally { setSaving(false) }
  }

  async function addBulk() {
    if (!bulk.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/objections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk', role, text: bulk }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { toast({ title: 'Fehler', description: data.error, variant: 'destructive' }); return }
      toast({ title: `${data.inserted} Einwände angelegt` }); setBulk('')
      // Neu laden ist einfacher als lokal mergen
      location.reload()
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    const res = await fetch('/api/admin/objections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) })
    if (res.ok) { setObjections(objections.filter(o => o.id !== id)); toast({ title: 'Gelöscht' }) }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Einwand hinzufügen</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rolle</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Einwand (typische Aussage)</Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="z.B. Kein Interesse" />
            </div>
          </div>
          <Field label="Antwort" v={response} on={setResponse} rows={3} />
          <Field label="Psychologie / Hinweis (optional)" v={psych} on={setPsych} rows={2} />
          <Button onClick={addOne} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Hinzufügen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Mehrere einfügen (schnell)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs text-slate-400">Eine Zeile pro Einwand — Format: <span className="font-mono">Einwand | Antwort</span> (Rolle = oben gewählt)</Label>
          <Textarea value={bulk} onChange={e => setBulk(e.target.value)} rows={5} className="font-mono text-xs"
            placeholder={'Kein Interesse | Verstehe ich — die meisten sagen das zuerst. Kurze Frage: …\nKeine Zeit | Genau deshalb rufe ich an — 2 Minuten reichen, um zu sehen ob es passt.'} />
          <Button onClick={addBulk} disabled={saving || !bulk.trim()} variant="outline">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Alle einfügen
          </Button>
        </CardContent>
      </Card>

      {ROLES.map(r => {
        const list = objections.filter(o => o.role === r || (r === 'Opener' && !o.role))
        if (!list.length) return null
        return (
          <div key={r}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{r}</p>
            <div className="space-y-2">
              {list.map(o => (
                <Card key={o.id}>
                  <CardContent className="p-3 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm">{o.objection_label}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{o.response}</p>
                      {o.psychology_note && <p className="text-xs text-slate-400 mt-1">💡 {o.psychology_note}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => del(o.id)} className="text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Field({ label, v, on, rows = 2, mono = false }: { label: string; v: string; on: (v: string) => void; rows?: number; mono?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea value={v} onChange={e => on(e.target.value)} rows={rows} className={mono ? 'font-mono text-xs' : ''} />
    </div>
  )
}
