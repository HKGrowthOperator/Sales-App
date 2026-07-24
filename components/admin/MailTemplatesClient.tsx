'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/hooks/use-toast'
import { Mail, Save, Trash2, Loader2, Plus, Info } from 'lucide-react'

// ============================================================
// Admin: Mail-Vorlagen bearbeiten.
// Vorlagen aus der DB haben Vorrang vor den eingebauten Texten —
// hier geschriebene Inhalte werden also sofort verwendet.
// ============================================================

type Tpl = {
  id?: string
  key: string
  product_area: string | null
  subject: string
  body_text: string
  is_active?: boolean
}

// Alle Mails der HK-Strecke. Beschreibung = wann sie ausgelöst wird.
const KNOWN_KEYS: { key: string; label: string; when: string }[] = [
  { key: 'HK-SALES-INFO-MAIL', label: 'Info-Mail (kein Termin gewünscht)', when: 'Opener löst sie im Dialer aus, wenn der Kunde „schick mir was" sagt. Enthält Fakten, Testimonials, Angebote ohne Preis, Value.' },
  { key: 'HK-SALES-EXPERT-CALL-BOOKED', label: 'Terminbestätigung Setter-Call', when: 'Sofort nach der Buchung durch den Opener.' },
  { key: 'HK-SALES-EXPERT-CALL-MID', label: 'Zwischen-Reminder Setter-Call', when: 'Mittig zwischen Buchung und Termin — Zoom-Link + Testimonials.' },
  { key: 'HK-SALES-EXPERT-CALL-24H', label: 'Reminder 1 Tag vorher (Setter)', when: '24h vor dem Termin. Experte bereitet sich vor, Zoom-Link, Anti-No-Show, Umbuchung.' },
  { key: 'HK-SALES-EXPERT-CALL-1H', label: 'Reminder 1 Stunde vorher (Setter)', when: '1h vor dem Termin. Zoom-Link + Uhrzeit.' },
  { key: 'HK-SALES-CLOSER-BOOKED', label: 'Terminbestätigung Closer-Call', when: 'Sofort nach der Buchung durch den Setter.' },
  { key: 'HK-SALES-CLOSER-24H', label: 'Reminder 1 Tag vorher (Closer)', when: '24h vor dem Closer-Termin.' },
  { key: 'HK-SALES-CLOSER-1H', label: 'Reminder 1 Stunde vorher (Closer)', when: '1h vor dem Closer-Termin.' },
  { key: 'HK-SALES-ONBOARDING', label: 'Onboarding (nach Abschluss)', when: 'Wenn ein Lead auf „Gewonnen" gesetzt wird.' },
]

const AREAS = [
  { v: 'all', label: 'Alle Produktfelder' },
  { v: 'website', label: 'Website' },
  { v: 'social', label: 'Social Media' },
  { v: 'ai', label: 'KI-Integration' },
  { v: 'system', label: 'Gesamtsystem' },
]

const VARS = '{{contact_first_name}} · {{company_name}} · {{appointment_date}} · {{appointment_time}} · {{call_link}} · {{assigned_setter_name}} · {{assigned_closer_name}} · {{assigned_opener_name}}'

const empty: Tpl = { key: '', product_area: null, subject: '', body_text: '' }

export function MailTemplatesClient({ initial }: { initial: Tpl[] }) {
  const [list, setList] = useState<Tpl[]>(initial)
  const [form, setForm] = useState<Tpl>({ ...empty })
  const [saving, setSaving] = useState(false)

  const upd = (k: keyof Tpl, v: any) => setForm(p => ({ ...p, [k]: v }))

  async function save() {
    if (!form.key || !form.subject || !form.body_text) {
      toast({ title: 'Bitte Vorlage, Betreff und Text ausfüllen', variant: 'destructive' }); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/mail-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', template: form }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) { toast({ title: 'Fehler', description: data.error, variant: 'destructive' }); return }
      setList(prev => form.id ? prev.map(t => t.id === data.template.id ? data.template : t) : [data.template, ...prev])
      toast({ title: 'Vorlage gespeichert', description: data.template.key })
      setForm({ ...empty })
    } finally { setSaving(false) }
  }

  async function del(id?: string) {
    if (!id || !confirm('Vorlage löschen? Danach greift wieder der eingebaute Standardtext.')) return
    const res = await fetch('/api/admin/mail-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    if (res.ok) { setList(l => l.filter(t => t.id !== id)); toast({ title: 'Gelöscht' }) }
  }

  const meta = (key: string) => KNOWN_KEYS.find(k => k.key === key)

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mail-Vorlagen</h1>
        <p className="text-sm text-slate-500">
          Hier geschriebene Texte werden sofort verwendet und überschreiben die eingebauten Standardtexte.
        </p>
        <p className="text-xs text-slate-400 mt-1">Platzhalter: <span className="font-mono">{VARS}</span></p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{form.id ? 'Vorlage bearbeiten' : 'Vorlage schreiben'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Welche Mail? *</Label>
              <Select value={form.key} onValueChange={v => upd('key', v)}>
                <SelectTrigger><SelectValue placeholder="Mail auswählen…" /></SelectTrigger>
                <SelectContent>
                  {KNOWN_KEYS.map(k => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Produktfeld</Label>
              <Select value={form.product_area || 'all'} onValueChange={v => upd('product_area', v === 'all' ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AREAS.map(a => <SelectItem key={a.v} value={a.v}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {form.key && meta(form.key) && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-2 text-sm">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <span className="text-slate-700">{meta(form.key)!.when}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Betreff *</Label>
            <Input value={form.subject} onChange={e => upd('subject', e.target.value)} placeholder="z. B. Ihr Termin mit HK Growth am {{appointment_date}}" />
          </div>
          <div className="space-y-1.5">
            <Label>Text *</Label>
            <Textarea value={form.body_text} onChange={e => upd('body_text', e.target.value)} rows={14} className="font-mono text-xs" />
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {form.id ? 'Speichern' : 'Vorlage anlegen'}
            </Button>
            {form.id && <Button variant="outline" onClick={() => setForm({ ...empty })}>Neu / Abbrechen</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Übersicht aller Mails der Strecke */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Alle Mails der Strecke</CardTitle></CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100">
          {KNOWN_KEYS.map(k => {
            const own = list.filter(t => t.key === k.key)
            return (
              <div key={k.key} className="px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Mail className={`h-4 w-4 ${own.length ? 'text-green-600' : 'text-slate-300'}`} />
                  <span className="font-medium text-slate-800 text-sm">{k.label}</span>
                  {own.length
                    ? <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700">eigener Text</span>
                    : <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Standardtext</span>}
                  <Button variant="ghost" size="sm" className="ml-auto"
                    onClick={() => setForm(own[0] ? { ...own[0] } : { ...empty, key: k.key })}>
                    {own.length ? 'Bearbeiten' : <><Plus className="h-3.5 w-3.5 mr-1" /> Text schreiben</>}
                  </Button>
                  {own[0]?.id && (
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => del(own[0].id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 ml-6">{k.when}</p>
                {own.length > 1 && <p className="text-xs text-slate-400 ml-6">{own.length} Varianten (je Produktfeld)</p>}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
