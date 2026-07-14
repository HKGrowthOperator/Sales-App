'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/hooks/use-toast'
import { Bell, XCircle, RotateCw } from 'lucide-react'

const fmt = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
type F = 'faellig' | 'kommend' | 'fehlgeschlagen' | 'erledigt' | 'cancelled' | 'alle'

export function RemindersClient({ jobs }: { jobs: any[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<F>('faellig')
  const [busy, setBusy] = useState<string | null>(null)
  const now = Date.now()

  const match = (j: any, f: F) => {
    if (f === 'alle') return true
    if (f === 'faellig') return j.status === 'pending' && new Date(j.send_at).getTime() <= now
    if (f === 'kommend') return j.status === 'pending' && new Date(j.send_at).getTime() > now
    if (f === 'fehlgeschlagen') return j.status === 'failed'
    if (f === 'erledigt') return j.status === 'sent'
    if (f === 'cancelled') return j.status === 'cancelled'
    return true
  }
  const list = jobs.filter(j => match(j, filter))
  const count = (f: F) => jobs.filter(j => match(j, f)).length

  async function cancel(id: string) {
    setBusy(id)
    const { error } = await createClient().from('reminder_jobs').update({ status: 'cancelled' }).eq('id', id)
    setBusy(null)
    toast(error ? { title: 'Fehler', description: error.message, variant: 'destructive' } : { title: 'Reminder storniert' })
    if (!error) router.refresh()
  }

  const statusCls: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', sent: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-400' }
  const FILTERS: F[] = ['faellig', 'kommend', 'fehlgeschlagen', 'erledigt', 'cancelled', 'alle']
  const labels: Record<F, string> = { faellig: 'Fällig', kommend: 'Kommend', fehlgeschlagen: 'Fehlgeschlagen', erledigt: 'Erledigt', cancelled: 'Storniert', alle: 'Alle' }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Bell className="h-6 w-6 text-blue-600" /> Reminder</h1>
        <p className="text-slate-500 text-sm">Vorbereitete Termin-Reminder. Versand erst aktiv, wenn das Mail-System freigegeben ist.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-2.5 py-1 rounded-full border ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
            {labels[f]} ({count(f)})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-slate-400"><Bell className="h-10 w-10 mx-auto mb-2 opacity-20" /><p>Keine Reminder in dieser Ansicht</p></div>
      ) : (
        <div className="space-y-1.5">
          {list.map(j => (
            <Card key={j.id}>
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800">{j.type}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusCls[j.status] || 'bg-slate-100'}`}>{j.status}</span>
                    <span className="text-xs text-slate-400">{j.channel}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {fmt(j.send_at)}{' '}
                    {j.lead && <>· <Link href={`/leads/${j.lead.id}`} className="text-blue-600 hover:underline">{j.lead.company_name}</Link></>}
                    {j.last_error && <span className="text-red-500"> · {j.last_error}</span>}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {j.status === 'failed' && <Button size="sm" variant="outline" className="h-7 gap-1" disabled title="Versand noch nicht aktiv"><RotateCw className="h-3.5 w-3.5" /> Retry</Button>}
                  {j.status === 'pending' && <Button size="sm" variant="outline" className="h-7 gap-1 text-red-600 border-red-200" disabled={busy === j.id} onClick={() => cancel(j.id)}><XCircle className="h-3.5 w-3.5" /> Stornieren</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
