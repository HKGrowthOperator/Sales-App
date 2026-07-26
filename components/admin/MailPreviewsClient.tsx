'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MailStatus } from '@/components/leads/LeadDossierSections'
import { toast } from '@/lib/hooks/use-toast'
import { Mail, ChevronRight, Send, XCircle, ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react'

const fmt = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
const FILTERS = ['alle', 'draft', 'blocked_missing_email', 'approved', 'sent', 'failed', 'cancelled'] as const
// Nur in diesen Status lässt sich eine Mail noch anpassen (identisch zur API).
const EDITABLE = ['draft', 'approved', 'blocked_missing_email', 'failed', 'cancelled']

export function MailPreviewsClient({ jobs }: { jobs: any[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<typeof FILTERS[number]>('alle')
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [design, setDesign] = useState(true)
  // Bearbeitung genau einer Mail — der Entwurf im Formular, nicht in der DB.
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState({ subject: '', body: '', to_email: '' })

  const list = jobs.filter(j => filter === 'alle' || j.status === filter)

  async function setStatus(id: string, status: string) {
    setBusy(id)
    const patch: any = { status }
    if (status === 'sent') patch.sent_at = new Date().toISOString()
    const { error } = await createClient().from('email_jobs').update(patch).eq('id', id)
    setBusy(null)
    toast(error ? { title: 'Fehler', description: error.message, variant: 'destructive' } : { title: 'Aktualisiert', description: status })
    if (!error) router.refresh()
  }

  function startEdit(j: any) {
    setEditing(j.id)
    setDraft({ subject: j.subject || '', body: j.body || '', to_email: j.to_email || '' })
  }

  async function saveEdit(id: string) {
    setBusy(id)
    try {
      const res = await fetch('/api/mail-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', id, ...draft }),
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok || !out.ok) throw new Error(out.error || 'Speichern fehlgeschlagen')
      setEditing(null)
      toast({ title: 'Gespeichert', description: 'Nur diese eine Mail wurde geändert.' })
      router.refresh()
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message || String(e), variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Mail className="h-6 w-6 text-blue-600" /> Mail-Previews</h1>
        <p className="text-slate-500 text-sm">Vom System vorbereitete E-Mails — kein automatischer Versand. Manuell prüfen, anpassen, freigeben oder als gesendet markieren.</p>
        <p className="text-slate-400 text-xs mt-1">
          Änderungen hier gelten nur für die jeweilige Mail. Für alle künftigen Mails den Text unter{' '}
          <Link href="/admin/mail-templates" className="text-blue-600 hover:underline">Mail-Vorlagen</Link> ändern.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-2.5 py-1 rounded-full border ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
            {f === 'alle' ? 'Alle' : f === 'blocked_missing_email' ? 'Blockiert (keine E-Mail)' : f} ({f === 'alle' ? jobs.length : jobs.filter(j => j.status === f).length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-slate-400"><Mail className="h-10 w-10 mx-auto mb-2 opacity-20" /><p>Keine Mail-Previews</p></div>
      ) : (
        <div className="space-y-2">
          {list.map(j => (
            <Card key={j.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-800 truncate">{j.subject}</span>
                      <MailStatus status={j.status} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {j.type} · an {j.to_email || '—'} ·{' '}
                      {j.lead && <Link href={`/leads/${j.lead.id}`} className="text-blue-600 hover:underline">{j.lead.company_name}</Link>}
                      {' '}· {fmt(j.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setOpen(open === j.id ? null : j.id)}>
                      {open === j.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {j.last_error && (
                  <p className="mt-1.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1 break-words">
                    <span className="font-medium">Versand fehlgeschlagen:</span> {j.last_error}
                  </p>
                )}
                {open === j.id && editing === j.id ? (
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-slate-500">Empfänger</label>
                      <input
                        type="email"
                        value={draft.to_email}
                        onChange={e => setDraft({ ...draft, to_email: e.target.value })}
                        placeholder="keine Adresse hinterlegt"
                        className="w-full mt-0.5 text-sm rounded border border-slate-200 px-2 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-slate-500">Betreff</label>
                      <input
                        value={draft.subject}
                        onChange={e => setDraft({ ...draft, subject: e.target.value })}
                        className="w-full mt-0.5 text-sm rounded border border-slate-200 px-2 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wide text-slate-500">Text</label>
                      <textarea
                        value={draft.body}
                        onChange={e => setDraft({ ...draft, body: e.target.value })}
                        rows={20}
                        className="w-full mt-0.5 text-xs font-mono rounded border border-slate-200 px-2 py-1.5 leading-relaxed"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Datum, Uhrzeit und Call-Link stehen in der Termin-Box und werden beim Speichern neu gesetzt — sie müssen nicht im Text stehen.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-1" disabled={busy === j.id} onClick={() => saveEdit(j.id)}>
                        <Check className="h-3.5 w-3.5" /> Speichern
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" disabled={busy === j.id} onClick={() => setEditing(null)}>
                        <X className="h-3.5 w-3.5" /> Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : open === j.id && (
                  <div className="mt-2 space-y-2">
                    {j.body_html && (
                      <div className="flex gap-1.5">
                        <button onClick={() => setDesign(true)} className={`text-[11px] px-2 py-0.5 rounded border ${design ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>Design</button>
                        <button onClick={() => setDesign(false)} className={`text-[11px] px-2 py-0.5 rounded border ${!design ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>Text</button>
                      </div>
                    )}
                    {j.body_html && design ? (
                      <iframe srcDoc={j.body_html} sandbox="" title="Mail-Vorschau" className="w-full h-[540px] rounded border border-slate-200 bg-white" />
                    ) : (
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 rounded p-3 border border-slate-100">{j.body}</pre>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {EDITABLE.includes(j.status) && (
                        <Button size="sm" variant="outline" className="gap-1" disabled={busy === j.id} onClick={() => startEdit(j)}>
                          <Pencil className="h-3.5 w-3.5" /> Bearbeiten
                        </Button>
                      )}
                      {j.status === 'draft' && <Button size="sm" variant="outline" disabled={busy === j.id} onClick={() => setStatus(j.id, 'approved')}>Freigeben</Button>}
                      {['draft', 'approved'].includes(j.status) && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1 text-green-700 border-green-200" disabled={busy === j.id || !j.to_email} onClick={() => setStatus(j.id, 'sent')}><Send className="h-3.5 w-3.5" /> Als gesendet markieren</Button>
                          <Button size="sm" variant="outline" className="gap-1 text-red-600 border-red-200" disabled={busy === j.id} onClick={() => setStatus(j.id, 'cancelled')}><XCircle className="h-3.5 w-3.5" /> Stornieren</Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
