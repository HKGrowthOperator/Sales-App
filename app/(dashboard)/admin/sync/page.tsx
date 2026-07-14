import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CALENDAR_SYNC_LABEL } from '@/lib/scheduling/status'
import { Activity, AlertTriangle, CalendarClock, RotateCw } from 'lucide-react'

const fmt = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))

export default async function SyncCenterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const [failed, syncIssues, recent] = await Promise.all([
    supabase.from('automation_logs').select('*, lead:leads(id, company_name)').eq('status', 'failed').order('created_at', { ascending: false }).limit(50),
    supabase.from('appointments').select('id, lead_id, appointment_type, appointment_at, calendar_sync_status, lead:leads(company_name)').in('calendar_sync_status', ['failed', 'pending']).order('appointment_at', { ascending: false }).limit(50),
    supabase.from('automation_logs').select('*, lead:leads(id, company_name)').order('created_at', { ascending: false }).limit(120),
  ])
  const failedLogs = failed.data || []
  const issues = syncIssues.data || []
  const logs = recent.data || []

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Activity className="h-6 w-6 text-blue-600" /> Sync &amp; Automation</h1>
        <p className="text-slate-500 text-sm">Was ist gelaufen, was ist fehlgeschlagen — nichts verschwindet still in der DB.</p>
      </div>

      {/* Fehlgeschlagene Aktionen */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-red-600 mb-2 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Fehlgeschlagene Aktionen ({failedLogs.length})</h2>
        {failedLogs.length === 0 ? <p className="text-sm text-slate-400">Keine Fehler. 🎉</p> : (
          <div className="space-y-1.5">
            {failedLogs.map((l: any) => (
              <Card key={l.id} className="border-red-200 bg-red-50/40"><CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-red-700">{l.action_type}{l.message ? <span className="text-slate-600 font-normal"> — {l.message}</span> : ''}</p>
                  <p className="text-xs text-slate-500">{l.lead && <Link href={`/leads/${l.lead.id}`} className="text-blue-600 hover:underline">{l.lead.company_name}</Link>} · {fmt(l.created_at)}</p>
                </div>
                <button disabled className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-400 flex items-center gap-1" title="Retry kommt mit Google-Anbindung"><RotateCw className="h-3 w-3" /> Retry</button>
              </CardContent></Card>
            ))}
          </div>
        )}
      </section>

      {/* Calendar Sync */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> Calendar-Sync offen/fehlgeschlagen ({issues.length})</h2>
        {issues.length === 0 ? <p className="text-sm text-slate-400">Alles synchron oder intern.</p> : (
          <div className="space-y-1.5">
            {issues.map((a: any) => {
              const sync = CALENDAR_SYNC_LABEL[a.calendar_sync_status] || CALENDAR_SYNC_LABEL.internal_only
              return (
                <Card key={a.id}><CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{a.appointment_type} · {fmt(a.appointment_at)}</p>
                    <p className="text-xs text-slate-500">{a.lead && <Link href={`/leads/${a.lead_id}`} className="text-blue-600 hover:underline">{a.lead.company_name}</Link>}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${sync.cls}`}>{sync.label}</span>
                </CardContent></Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Letzte Logs */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 mb-2">Letzte Automation-Logs</h2>
        <div className="space-y-1">
          {logs.map((l: any) => (
            <div key={l.id} className="flex items-center justify-between gap-2 text-sm px-3 py-1.5 rounded border border-slate-100 bg-white">
              <div className="min-w-0">
                <span className={`font-medium ${l.status === 'failed' ? 'text-red-700' : 'text-slate-700'}`}>{l.action_type}</span>
                {l.message && <span className="text-slate-500"> — {l.message}</span>}
              </div>
              <span className="text-xs text-slate-400 shrink-0">{l.lead && <Link href={`/leads/${l.lead.id}`} className="text-blue-600 hover:underline mr-2">{l.lead.company_name}</Link>}{fmt(l.created_at)}</span>
            </div>
          ))}
          {logs.length === 0 && <p className="text-sm text-slate-400">Noch keine Logs.</p>}
        </div>
      </section>
    </div>
  )
}
