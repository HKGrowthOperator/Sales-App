'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/hooks/use-toast'
import { Loader2, Save, Trash2, Plus, CalendarClock, Link2, CheckCircle2 } from 'lucide-react'

type SchedRole = 'setter' | 'closer'
interface Prof {
  id: string; full_name: string | null; email: string; role: string; is_active: boolean
  default_call_link: string | null; google_calendar_id: string | null; google_oauth_connected: boolean
  google_overridable_blocks: string[] | null
}
interface Rule { id: string; user_id: string; role_type: SchedRole; weekday: number; start_time: string; end_time: string; slot_duration_minutes: number; buffer_before_minutes: number; buffer_after_minutes: number; is_active: boolean }
interface Exc { id: string; user_id: string; date: string; start_time: string | null; end_time: string | null; type: string; reason: string | null }

const WD = [{ n: 1, l: 'Mo' }, { n: 2, l: 'Di' }, { n: 3, l: 'Mi' }, { n: 4, l: 'Do' }, { n: 5, l: 'Fr' }, { n: 6, l: 'Sa' }, { n: 7, l: 'So' }]

export function AvailabilityEditor({ profiles, rules, exceptions }: { profiles: Prof[]; rules: Rule[]; exceptions: Exc[] }) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><CalendarClock className="h-6 w-6 text-blue-600" /> Verfügbarkeit verwalten</h1>
        <p className="text-slate-500 text-sm">Arbeitszeiten, Slotlänge, Puffer, Call-Links und Blocker pro Mitarbeiter.</p>
      </div>
      {profiles.map(p => (
        <UserCard key={p.id} prof={p}
          rules={rules.filter(r => r.user_id === p.id)}
          exceptions={exceptions.filter(e => e.user_id === p.id)} />
      ))}
    </div>
  )
}

function UserCard({ prof, rules, exceptions }: { prof: Prof; rules: Rule[]; exceptions: Exc[] }) {
  const router = useRouter()
  const [callLink, setCallLink] = useState(prof.default_call_link || '')
  const [gcalId, setGcalId] = useState(prof.google_calendar_id || '')
  const [active, setActive] = useState(prof.is_active)
  const [savingProfile, setSavingProfile] = useState(false)

  async function saveProfile() {
    setSavingProfile(true)
    const { error } = await createClient().from('profiles').update({
      default_call_link: callLink.trim() || null,
      google_calendar_id: gcalId.trim() || null,
      is_active: active,
    }).eq('id', prof.id)
    setSavingProfile(false)
    toast(error ? { title: 'Fehler', description: error.message, variant: 'destructive' } : { title: 'Profil gespeichert' })
    if (!error) router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span>{prof.full_name || prof.email} <span className="text-xs font-normal text-slate-400">· {prof.role}</span></span>
          <label className="flex items-center gap-1.5 text-xs font-normal">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-3.5 h-3.5" /> aktiv
          </label>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profil */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Link2 className="h-3 w-3" /> Call-Link (Zoom/Meet)</Label>
            <Input value={callLink} onChange={e => setCallLink(e.target.value)} placeholder="https://…" className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Google Calendar ID {prof.google_oauth_connected && <CheckCircle2 className="h-3 w-3 inline text-green-500" />}</Label>
            <Input value={gcalId} onChange={e => setGcalId(e.target.value)} placeholder="primary oder …@group.calendar.google.com" className="h-8 text-sm" />
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1" onClick={saveProfile} disabled={savingProfile}>
          {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Profil speichern
        </Button>

        <GoogleBlock prof={prof} />

        {/* Rollen-Verfügbarkeit */}
        <div className="grid md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <RoleBlock userId={prof.id} roleType="setter" rules={rules.filter(r => r.role_type === 'setter')} />
          <RoleBlock userId={prof.id} roleType="closer" rules={rules.filter(r => r.role_type === 'closer')} />
        </div>

        {/* Exceptions */}
        <ExceptionsBlock userId={prof.id} exceptions={exceptions} />
      </CardContent>
    </Card>
  )
}

// ============================================================
// Google-Kalender pro Person.
// ------------------------------------------------------------
// Die Ausnahmeliste ist der entscheidende Teil: Wer seinen Tag in
// Blöcken plant (Deep Work, Fokus, Pause …), hat in Google durchgehend
// „beschäftigt" stehen. Ohne Ausnahmen fände die App keinen einzigen
// freien Slot. Alles, was hier steht, darf überbucht werden.
// ============================================================
function GoogleBlock({ prof }: { prof: Prof }) {
  const router = useRouter()
  const [blocks, setBlocks] = useState((prof.google_overridable_blocks || ['Deep Work']).join(', '))
  const [busy, setBusy] = useState(false)

  async function call(body: any, okMsg: string) {
    setBusy(true)
    try {
      const res = await fetch('/api/integrations/google-calendar/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: prof.id, ...body }),
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok || !out.ok) throw new Error(out.error || 'Fehlgeschlagen')
      toast({ title: okMsg })
      router.refresh()
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message || String(e), variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" /> Google-Kalender
          {prof.google_oauth_connected
            ? <span className="text-green-600 inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> verbunden</span>
            : <span className="text-slate-400">nicht verbunden</span>}
        </span>
        {prof.google_oauth_connected ? (
          <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" disabled={busy}
            onClick={() => call({ action: 'disconnect' }, 'Verbindung getrennt')}>
            Trennen
          </Button>
        ) : (
          <a href="/api/integrations/google-calendar/connect">
            <Button size="sm" variant="outline" className="h-7 text-xs">Kalender verbinden</Button>
          </a>
        )}
      </div>

      {prof.google_oauth_connected && (
        <div className="space-y-1">
          <Label className="text-xs">Blöcke, über die Termine gelegt werden dürfen</Label>
          <Input value={blocks} onChange={e => setBlocks(e.target.value)}
            placeholder="Deep Work, Fokus" className="h-8 text-sm" />
          <p className="text-[11px] text-slate-400">
            Mit Komma trennen. Der Titel muss den Begriff nur enthalten — „Deep Work" trifft auch „🎯 Deep Work 3".
            Alles andere im Kalender gilt als belegt.
          </p>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={busy}
            onClick={() => call({ action: 'blocks', blocks: blocks.split(',') }, 'Ausnahmen gespeichert')}>
            <Save className="h-3 w-3" /> Ausnahmen speichern
          </Button>
        </div>
      )}
    </div>
  )
}

function RoleBlock({ userId, roleType, rules }: { userId: string; roleType: SchedRole; rules: Rule[] }) {
  const router = useRouter()
  const base = rules[0]
  const [enabled, setEnabled] = useState(rules.length > 0 && rules.some(r => r.is_active))
  const [days, setDays] = useState<number[]>(rules.length ? [...new Set(rules.map(r => r.weekday))] : [1, 2, 3, 4, 5])
  const [start, setStart] = useState(base?.start_time?.slice(0, 5) || (roleType === 'closer' ? '10:00' : '09:00'))
  const [end, setEnd] = useState(base?.end_time?.slice(0, 5) || (roleType === 'closer' ? '18:00' : '17:00'))
  const [slot, setSlot] = useState(base?.slot_duration_minutes || (roleType === 'closer' ? 45 : 30))
  const [bufB, setBufB] = useState(base?.buffer_before_minutes ?? 0)
  const [bufA, setBufA] = useState(base?.buffer_after_minutes ?? (roleType === 'closer' ? 15 : 10))
  const [saving, setSaving] = useState(false)

  function toggleDay(n: number) { setDays(d => d.includes(n) ? d.filter(x => x !== n) : [...d, n].sort()) }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    // Idempotent: bestehende Regeln dieser Rolle ersetzen
    await supabase.from('availability_rules').delete().eq('user_id', userId).eq('role_type', roleType)
    if (enabled && days.length) {
      const rows = days.map(wd => ({
        user_id: userId, role_type: roleType, weekday: wd,
        start_time: start, end_time: end, slot_duration_minutes: slot,
        buffer_before_minutes: bufB, buffer_after_minutes: bufA, is_active: true,
      }))
      await supabase.from('availability_rules').insert(rows)
    }
    setSaving(false)
    toast({ title: `${roleType === 'setter' ? 'Setter' : 'Closer'}-Verfügbarkeit gespeichert` })
    router.refresh()
  }

  return (
    <div className={`rounded-lg border p-3 ${roleType === 'setter' ? 'border-purple-100' : 'border-blue-100'}`}>
      <label className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700">{roleType === 'setter' ? 'Setter' : 'Closer'}-Zeiten</span>
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-4 h-4" />
      </label>
      {enabled && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {WD.map(w => (
              <button key={w.n} type="button" onClick={() => toggleDay(w.n)}
                className={`w-8 h-7 rounded text-xs font-medium ${days.includes(w.n) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{w.l}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[11px]">Von</Label><Input type="time" value={start} onChange={e => setStart(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-[11px]">Bis</Label><Input type="time" value={end} onChange={e => setEnd(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-[11px]">Slot (Min)</Label><Input type="number" value={slot} onChange={e => setSlot(+e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-[11px]">Puffer nach</Label><Input type="number" value={bufA} onChange={e => setBufA(+e.target.value)} className="h-8 text-sm" /></div>
          </div>
        </div>
      )}
      <Button size="sm" variant="outline" className="gap-1 mt-2 w-full" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Speichern
      </Button>
    </div>
  )
}

function ExceptionsBlock({ userId, exceptions }: { userId: string; exceptions: Exc[] }) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function addBlocker() {
    if (!date) { toast({ title: 'Datum fehlt', variant: 'destructive' }); return }
    setBusy(true)
    const { error } = await createClient().from('availability_exceptions').insert({
      user_id: userId, date, type: 'unavailable', reason: reason.trim() || 'Blocker', is_active: true,
    })
    setBusy(false)
    if (error) { toast({ title: 'Fehler', description: error.message, variant: 'destructive' }); return }
    setDate(''); setReason(''); router.refresh()
  }
  async function remove(id: string) {
    await createClient().from('availability_exceptions').update({ is_active: false }).eq('id', id)
    router.refresh()
  }

  return (
    <div className="pt-2 border-t border-slate-100">
      <Label className="text-xs font-semibold text-slate-600">Blocker / Urlaub (ganztägig)</Label>
      <div className="flex flex-wrap gap-2 mt-1 items-end">
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-sm w-40" />
        <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Grund (optional)" className="h-8 text-sm flex-1 min-w-[120px]" />
        <Button size="sm" variant="outline" className="gap-1 h-8" onClick={addBlocker} disabled={busy}><Plus className="h-3.5 w-3.5" /> Blocker</Button>
      </div>
      {exceptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {exceptions.map(e => (
            <span key={e.id} className="text-xs bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              {e.date}{e.reason ? ` · ${e.reason}` : ''}
              <button onClick={() => remove(e.id)}><Trash2 className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
