'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Script, Profile, ScriptStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/hooks/use-toast'
import { ScriptPersonalizer } from '@/components/scripts/ScriptPersonalizer'
import { renderMarkup, ColorLegend, SCRIPT_FONT } from '@/components/shared/ScriptMarkup'
import { Pencil, Plus, CheckCircle, XCircle, Clock, FileEdit, Sparkles, BookOpen, ChevronDown, ChevronUp, Target } from 'lucide-react'

interface Props {
  profile: Profile
  masterScripts: Script[]
  personalScripts: Script[]          // eigene Versionen des Users
  pendingScripts: (Script & { owner?: { full_name: string | null } })[]  // für Admin
}

const STATUS_BADGE: Record<ScriptStatus, { label: string; cls: string }> = {
  draft:          { label: 'Entwurf',        cls: 'bg-slate-100 text-slate-600' },
  pending_review: { label: 'In Prüfung',     cls: 'bg-amber-100 text-amber-700' },
  approved:       { label: '✓ Freigegeben',  cls: 'bg-green-100 text-green-700' },
  rejected:       { label: 'Abgelehnt',      cls: 'bg-red-100 text-red-700' },
  archived:       { label: 'Archiviert',     cls: 'bg-slate-100 text-slate-400' },
}

const ROLE_DOT: Record<string, string> = { Opener: 'bg-orange-500', Setter: 'bg-purple-500', Closer: 'bg-blue-600' }

export function ScriptsClient({ profile, masterScripts, personalScripts, pendingScripts }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<{ master: Script; existing: Script | null } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [openScript, setOpenScript] = useState<string | null>(null)   // aufgeklapptes Voll-Skript (Review)

  const personalByParent = new Map(personalScripts.map(p => [p.parent_script_id, p]))
  const grouped = masterScripts.reduce((acc, s) => {
    (acc[s.role] ||= []).push(s); return acc
  }, {} as Record<string, Script[]>)
  const roleOrder = ['Opener', 'Setter', 'Closer']

  async function review(id: string, status: 'approved' | 'rejected') {
    setBusy(id)
    const supabase = createClient()
    const { error } = await supabase.from('scripts').update({
      status,
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    }).eq('id', id)
    setBusy(null)
    if (error) { toast({ title: 'Fehler', description: error.message, variant: 'destructive' }); return }
    toast({ title: status === 'approved' ? 'Freigegeben' : 'Abgelehnt' })
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Skripte</h1>
        <p className="text-slate-500 text-sm">HK-Master als Rahmen — erstelle deine eigene, authentische Version.</p>
      </div>

      {/* ── Admin: Freigaben ───────────────────────────────────────────── */}
      {profile.role === 'admin' && pendingScripts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Freigaben ({pendingScripts.length})
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {pendingScripts.map(s => (
              <Card key={s.id} className="border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <span>{s.title}</span>
                    <span className="text-xs font-normal text-slate-400">{s.owner?.full_name || 'Mitarbeiter'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-slate-500 line-clamp-3 whitespace-pre-line">{s.opening_line}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => review(s.id, 'approved')} disabled={busy === s.id}
                      className="gap-1 bg-green-600 hover:bg-green-700"><CheckCircle className="h-3.5 w-3.5" /> Freigeben</Button>
                    <Button size="sm" variant="outline" onClick={() => review(s.id, 'rejected')} disabled={busy === s.id}
                      className="gap-1 text-red-600 border-red-200"><XCircle className="h-3.5 w-3.5" /> Ablehnen</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Meine Skripte ──────────────────────────────────────────────── */}
      {personalScripts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-500" /> Meine Versionen ({personalScripts.length})
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {personalScripts.map(s => {
              const master = masterScripts.find(m => m.id === s.parent_script_id) || null
              return (
                <Card key={s.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between gap-2">
                      <span>{s.title}</span>
                      <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${STATUS_BADGE[s.status].cls}`}>
                        {STATUS_BADGE[s.status].label}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-slate-500 line-clamp-2 whitespace-pre-line">{s.opening_line}</p>
                    {master && (
                      <Button size="sm" variant="outline" className="gap-1"
                        onClick={() => setEditing({ master, existing: s })}>
                        <Pencil className="h-3.5 w-3.5" /> Bearbeiten
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* ── HK Master-Skripte (mit Voll-Ansicht für Review/Feedback) ───── */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <ColorLegend />
      </div>
      {roleOrder.filter(r => grouped[r]?.length).map(role => (
        <section key={role}>
          <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${ROLE_DOT[role] || 'bg-slate-400'}`} />
            {role} — HK-Master
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {grouped[role].map(s => {
              const mine = personalByParent.get(s.id) || null
              const isOpen = openScript === s.id
              return (
                <Card key={s.id} className={isOpen ? 'lg:col-span-2' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{s.title}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.entry_angle && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{s.entry_angle}</span>}
                      {s.method_name && <span className="text-xs text-indigo-500">{s.method_name}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {s.call_goal && (
                      <p className="text-xs text-slate-600 flex gap-1.5">
                        <Target className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span><span className="font-semibold">Ziel: </span>{s.call_goal}</span>
                      </p>
                    )}
                    {s.core_question && (
                      <p className="text-xs text-slate-600"><span className="font-semibold">Kernfrage: </span>{s.core_question}</p>
                    )}
                    {isOpen && s.full_script && (
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-[15px] text-slate-800 leading-[1.75] whitespace-pre-line" style={SCRIPT_FONT}>
                          {renderMarkup(s.full_script)}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.full_script && (
                        <Button size="sm" variant="outline" className="gap-1.5"
                          onClick={() => setOpenScript(isOpen ? null : s.id)}>
                          <BookOpen className="h-3.5 w-3.5" />
                          {isOpen ? <>Skript zuklappen <ChevronUp className="h-3.5 w-3.5" /></>
                                  : <>Vollständiges Skript <ChevronDown className="h-3.5 w-3.5" /></>}
                        </Button>
                      )}
                      <Button size="sm" variant={mine ? 'outline' : 'default'} className="gap-1.5"
                        onClick={() => setEditing({ master: s, existing: mine })}>
                        {mine ? <><FileEdit className="h-3.5 w-3.5" /> Meine Version ({STATUS_BADGE[mine.status].label})</>
                              : <><Plus className="h-3.5 w-3.5" /> Eigene Version erstellen</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ))}

      {editing && (
        <ScriptPersonalizer
          master={editing.master}
          existing={editing.existing}
          profile={profile}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh() }}
        />
      )}
    </div>
  )
}
