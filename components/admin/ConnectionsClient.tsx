'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/hooks/use-toast'
import { CheckCircle2, XCircle, AlertTriangle, Play, Loader2, Database, Mail, CalendarClock, Clock } from 'lucide-react'

interface Health {
  supabaseOk: boolean
  emailConfigured: boolean
  googleConfigured: boolean
  cronConfigured: boolean
  counts: { remindersDue: number; mailsSendable: number; apptPendingSync: number; failedLogs: number }
  lastRun: { message: string; created_at: string; metadata_json: any } | null
}
interface Flags { email_sending_enabled: boolean; auto_send_confirmations: boolean; calendar_sync_enabled: boolean }

const fmt = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))

export function ConnectionsClient({ health, flags: initialFlags }: { health: Health; flags: Flags }) {
  const router = useRouter()
  const [flags, setFlags] = useState(initialFlags)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [lastSummary, setLastSummary] = useState<any>(null)

  async function toggle(key: keyof Flags) {
    const next = !flags[key]
    // Schutz: Live-Versand nur wenn Provider konfiguriert
    if (key === 'email_sending_enabled' && next && !health.emailConfigured) {
      toast({ title: 'Resend nicht konfiguriert', description: 'RESEND_API_KEY + EMAIL_FROM in .env setzen.', variant: 'destructive' }); return
    }
    if (key === 'calendar_sync_enabled' && next && !health.googleConfigured) {
      toast({ title: 'Google nicht konfiguriert', description: 'GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET setzen, dann Kalender unter Verfügbarkeit verbinden.', variant: 'destructive' }); return
    }
    setSavingKey(key)
    setFlags(f => ({ ...f, [key]: next }))
    // Upsert statt Update: app_settings kann leer sein (sonst würde der Schalter still fehlschlagen).
    const { error } = await createClient()
      .from('app_settings')
      .upsert({ key, value: next, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    setSavingKey(null)
    if (error) { setFlags(f => ({ ...f, [key]: !next })); toast({ title: 'Fehler', description: error.message, variant: 'destructive' }); return }
    toast({ title: 'Gespeichert', description: `${key} = ${next}` })
    router.refresh()
  }

  async function runNow() {
    setRunning(true)
    try {
      const res = await fetch('/api/jobs/run', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Fehler')
      setLastSummary(json.summary)
      toast({ title: 'Jobs ausgeführt', description: 'Siehe Zusammenfassung unten.' })
      router.refresh()
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message || String(e), variant: 'destructive' })
    } finally { setRunning(false) }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verbindungen &amp; Automationen</h1>
        <p className="text-slate-500 text-sm">Vor dem Testlauf prüfen: alles grün? Automationen scharf?</p>
      </div>

      {/* Connection cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        <StatusCard icon={Database} label="Supabase (Datenbank)" ok={health.supabaseOk} okText="verbunden" failText="nicht erreichbar" />
        <StatusCard icon={Mail} label="Resend (E-Mail)" ok={health.emailConfigured} okText="konfiguriert" failText="RESEND_API_KEY / EMAIL_FROM fehlt" warn />
        <StatusCard icon={CalendarClock} label="Google Calendar" ok={health.googleConfigured} okText="konfiguriert" failText="GOOGLE_* fehlt" warn />
        <StatusCard icon={Clock} label="Cron-Secret (Auto-Runner)" ok={health.cronConfigured} okText="gesetzt" failText="CRON_SECRET fehlt (Vercel-Cron)" warn />
      </div>

      {/* Flags */}
      <Card><CardContent className="p-4 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Automations-Schalter</h2>
        <FlagRow label="Live-E-Mail-Versand" desc="Reminder & freigegebene Mails werden tatsächlich gesendet (sonst nur Preview)." value={flags.email_sending_enabled} disabled={savingKey === 'email_sending_enabled'} onToggle={() => toggle('email_sending_enabled')} />
        <FlagRow label="Bestätigungsmails automatisch senden" desc="Termin-Bestätigungen ohne manuelle Freigabe senden (Draft → direkt)." value={flags.auto_send_confirmations} disabled={savingKey === 'auto_send_confirmations'} onToggle={() => toggle('auto_send_confirmations')} />
        <FlagRow label="Google-Calendar-Sync" desc="Termine als echte Events in Google Calendar spiegeln." value={flags.calendar_sync_enabled} disabled={savingKey === 'calendar_sync_enabled'} onToggle={() => toggle('calendar_sync_enabled')} />
      </CardContent></Card>

      {/* Pending work + run now */}
      <Card><CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Offene Jobs</h2>
          <Button size="sm" onClick={runNow} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Jobs jetzt ausführen
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <Stat n={health.counts.remindersDue} label="Reminder fällig" />
          <Stat n={health.counts.mailsSendable} label="Mails sendbar" />
          <Stat n={health.counts.apptPendingSync} label="Sync offen" />
          <Stat n={health.counts.failedLogs} label="Fehler" danger={health.counts.failedLogs > 0} />
        </div>
        {health.lastRun && (
          <p className="text-xs text-slate-500">Letzter Lauf: {fmt(health.lastRun.created_at)} — {health.lastRun.message}</p>
        )}
        {lastSummary && (
          <pre className="text-xs bg-slate-50 border border-slate-100 rounded p-3 overflow-auto">{JSON.stringify(lastSummary, null, 2)}</pre>
        )}
      </CardContent></Card>

      <p className="text-xs text-slate-400">
        Hinweis: Solange die Schalter aus sind oder Keys fehlen, erzeugt das System nur Previews/Jobs und sendet nichts — gefahrlos testbar.
      </p>
    </div>
  )
}

function StatusCard({ icon: Icon, label, ok, okText, failText, warn = false }: { icon: any; label: string; ok: boolean; okText: string; failText: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 ${ok ? 'border-green-200 bg-green-50' : warn ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
      <Icon className={`h-5 w-5 shrink-0 ${ok ? 'text-green-600' : warn ? 'text-amber-600' : 'text-red-600'}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className={`text-xs flex items-center gap-1 ${ok ? 'text-green-700' : warn ? 'text-amber-700' : 'text-red-700'}`}>
          {ok ? <CheckCircle2 className="h-3 w-3" /> : warn ? <AlertTriangle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {ok ? okText : failText}
        </p>
      </div>
    </div>
  )
}

function FlagRow({ label, desc, value, disabled, onToggle }: { label: string; desc: string; value: boolean; disabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button onClick={onToggle} disabled={disabled}
        className={`shrink-0 w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-green-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 ${value ? 'left-6.5 translate-x-0' : 'left-0.5'} w-5 h-5 rounded-full bg-white transition-all`} style={{ left: value ? '26px' : '2px' }} />
      </button>
    </div>
  )
}

function Stat({ n, label, danger = false }: { n: number; label: string; danger?: boolean }) {
  return (
    <div className={`rounded-lg border p-2 ${danger ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
      <p className={`text-xl font-bold ${danger ? 'text-red-600' : 'text-slate-700'}`}>{n}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}
