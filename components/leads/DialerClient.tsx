'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lead, Profile, LeadStatus, CallResult, RoleContext } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/hooks/use-toast'
import {
  Phone, PhoneOutgoing, Building2, User, Globe, ChevronLeft, ChevronRight,
  Loader2, CheckCircle2, Sparkles, ExternalLink, SkipForward,
} from 'lucide-react'

// ============================================================
// Power-Dialer — Anruf-Warteschlange (Sales App v1.1)
// ------------------------------------------------------------
// Zeigt einen Lead nach dem anderen mit allem, was für den Anruf
// zählt (Pitch, Engstellen, Anlass, Ansprache-Hinweise). Ein Klick
// wählt (tel:), danach schnelles Ergebnis-Logging (call_note +
// kpi_event + Status) und automatisch der nächste Lead.
// ============================================================

interface Props {
  profile: Profile
  initialQueue: Lead[]
}

const roleContextFor = (role: string): RoleContext =>
  role === 'setter' ? 'Setter' : role === 'closer' ? 'Closer' : 'Opener'

// Ergebnis → Folge-Status + KPI-Label
const OUTCOMES: { result: CallResult; label: string; status: LeadStatus; cls: string; dnc?: boolean }[] = [
  { result: 'Nicht erreicht', label: 'Nicht erreicht', status: 'Nicht erreicht', cls: 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100' },
  { result: 'Interessiert', label: 'Interessiert', status: 'Interessiert', cls: 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100' },
  { result: 'Termin vereinbart', label: 'Termin vereinbart', status: 'Setter-Call geplant', cls: 'border-blue-300 bg-blue-500 text-white hover:bg-blue-600' },
  { result: 'Rückruf vereinbart', label: 'Rückruf', status: 'Später erneut kontaktieren', cls: 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
  { result: 'Kein Interesse', label: 'Kein Interesse', status: 'Nicht passend', cls: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' },
  { result: 'Später erneut kontaktieren', label: 'Später erneut', status: 'Später erneut kontaktieren', cls: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { result: 'Nicht mehr kontaktieren', label: '⛔ Nicht mehr', status: 'Nicht mehr kontaktieren', cls: 'border-zinc-400 bg-zinc-200 text-zinc-800 hover:bg-zinc-300', dnc: true },
]

export function DialerClient({ profile, initialQueue }: Props) {
  const router = useRouter()
  const [queue, setQueue] = useState<Lead[]>(initialQueue)
  const [idx, setIdx] = useState(0)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [called, setCalled] = useState(false)
  const [done, setDone] = useState(0)

  const lead = queue[idx]
  const roleContext = roleContextFor(profile.role)

  const progress = useMemo(
    () => (queue.length ? Math.round((idx / queue.length) * 100) : 0),
    [idx, queue.length],
  )

  function next() {
    setNote('')
    setCalled(false)
    if (idx + 1 >= queue.length) {
      setIdx(queue.length) // Ende
    } else {
      setIdx(i => i + 1)
    }
  }

  async function logOutcome(o: (typeof OUTCOMES)[number]) {
    if (!lead || saving) return
    setSaving(true)
    const supabase = createClient()
    try {
      // 1. Call-Note
      await supabase.from('call_notes').insert({
        lead_id: lead.id,
        user_id: profile.id,
        role_context: roleContext,
        call_result: o.result,
        raw_note: note.trim() || null,
      })
      // 2. KPI-Event
      await supabase.from('kpi_events').insert({
        lead_id: lead.id,
        actor_user_id: profile.id,
        role_type: profile.role,
        event_type: 'call',
        metadata_json: { result: o.result, source: 'dialer' },
      })
      // 3. Lead-Status
      const upd: Record<string, unknown> = {
        status: o.status,
        last_contact_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      if (o.dnc) { upd.do_not_contact = true; upd.opt_out_at = new Date().toISOString() }
      await supabase.from('leads').update(upd).eq('id', lead.id)

      setDone(d => d + 1)
      next()
    } catch (e: any) {
      toast({ title: 'Speichern fehlgeschlagen', description: e?.message || 'Unbekannter Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ---------- leer / fertig ----------
  if (!queue.length) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-3">
        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
        <h1 className="text-2xl font-bold text-slate-900">Warteschlange leer</h1>
        <p className="text-slate-500">Keine offenen Leads zum Anrufen. Importiere neue Leads oder ändere die Filter.</p>
        <div className="flex gap-2 justify-center pt-2">
          <Link href="/leads"><Button variant="outline">Zu den Leads</Button></Link>
          <Link href="/leads/upload"><Button className="bg-blue-600 hover:bg-blue-700">Leads importieren</Button></Link>
        </div>
      </div>
    )
  }

  if (idx >= queue.length) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-3">
        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
        <h1 className="text-2xl font-bold text-slate-900">Runde geschafft! 🎉</h1>
        <p className="text-slate-500">{done} Anruf{done === 1 ? '' : 'e'} protokolliert.</p>
        <div className="flex gap-2 justify-center pt-2">
          <Button onClick={() => router.refresh()} className="bg-blue-600 hover:bg-blue-700">Neue Runde laden</Button>
          <Link href="/kpi"><Button variant="outline">Meine KPIs</Button></Link>
        </div>
      </div>
    )
  }

  const phoneHref = lead.phone ? `tel:${lead.phone.replace(/[^\d+]/g, '')}` : undefined

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Fortschritt */}
      <div className="flex items-center justify-between text-sm">
        <Link href="/dashboard" className="flex items-center gap-1 text-slate-500 hover:text-slate-800">
          <ChevronLeft className="h-4 w-4" /> Dashboard
        </Link>
        <span className="text-slate-500">Lead {idx + 1} / {queue.length} · {done} erledigt</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Lead-Karte */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-400 shrink-0" />
                <span className="truncate">{lead.company_name}</span>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-slate-500">
                {(lead.contact_name || lead.management) && (
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{lead.contact_name || lead.management}</span>
                )}
                {lead.industry && <span className="text-xs text-slate-400">{lead.industry}</span>}
                {lead.cross_sell_score != null && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Cross-Sell {lead.cross_sell_score}/6</span>
                )}
              </div>
            </div>
            <Link href={`/leads/${lead.id}`} title="Volles Dossier" className="text-slate-400 hover:text-slate-700 shrink-0">
              <ExternalLink className="h-5 w-5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Anruf-Button */}
          <a href={phoneHref} onClick={() => setCalled(true)}>
            <Button size="xl" className={`w-full ${called ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <PhoneOutgoing className="h-5 w-5 mr-2" />
              {lead.phone || 'Keine Nummer'}{called ? ' · angerufen' : ''}
            </Button>
          </a>

          {/* Gesprächsintelligenz */}
          {lead.opener_pitch && (
            <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700 mb-0.5 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Opener-Pitch</p>
              <p className="text-sm text-slate-700">{lead.opener_pitch}</p>
            </div>
          )}
          {lead.hiring_signal && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-0.5">🔥 Akuter Anlass / Kaufsignal</p>
              <p className="text-sm text-slate-700">{lead.hiring_signal}</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            {(lead.key_bottlenecks || lead.pain_guess) && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Engstellen / Pain</p>
                <p className="text-slate-700">{lead.key_bottlenecks || lead.pain_guess}</p>
              </div>
            )}
            {lead.approach_notes && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">📌 Ansprache</p>
                <p className="text-slate-700">{lead.approach_notes}</p>
              </div>
            )}
          </div>
          {(lead.website || lead.email) && (
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              {lead.website && (
                <a href={lead.website.includes('://') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"><Globe className="h-3.5 w-3.5" />{lead.website}</a>
              )}
              {lead.email && <span className="flex items-center gap-1">{lead.email}</span>}
            </div>
          )}

          {/* Notiz */}
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Kurze Gesprächsnotiz (optional)…"
            rows={2}
          />

          {/* Ergebnis-Buttons */}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Ergebnis wählen — speichert &amp; springt zum nächsten Lead:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {OUTCOMES.map(o => (
                <button
                  key={o.result}
                  disabled={saving}
                  onClick={() => logOutcome(o)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${o.cls}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Überspringen */}
          <div className="flex justify-between pt-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              {saving && <><Loader2 className="h-3 w-3 animate-spin" /> speichere…</>}
            </span>
            <button onClick={next} disabled={saving} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <SkipForward className="h-4 w-4" /> Überspringen <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
