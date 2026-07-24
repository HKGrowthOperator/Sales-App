'use client'

import { useState } from 'react'
import { Profile, UserRole } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/hooks/use-toast'
import { Users, Check, Loader2, ShieldCheck, PhoneOutgoing, UserCheck, Crown } from 'lucide-react'

// ============================================================
// Team-/Rollenverwaltung (Admin) — legt fest, wer Opener/Setter/
// Closer/Admin ist. Skripte und Einwände hängen an der ROLLE,
// nicht an der Person — hier wird die Rolle je Profil gesetzt.
// ============================================================

const ROLE_META: Record<UserRole, { label: string; icon: any; cls: string }> = {
  opener: { label: 'Opener', icon: PhoneOutgoing, cls: 'text-orange-600' },
  setter: { label: 'Setter', icon: UserCheck, cls: 'text-purple-600' },
  closer: { label: 'Closer', icon: ShieldCheck, cls: 'text-blue-600' },
  admin:  { label: 'Admin',  icon: Crown, cls: 'text-slate-700' },
}
const ROLES: UserRole[] = ['opener', 'setter', 'closer', 'admin']

interface Props {
  me: Profile
  initialProfiles: Profile[]
}

export function TeamManager({ me, initialProfiles }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function patch(id: string, body: Record<string, unknown>) {
    setSavingId(id)
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast({ title: 'Fehler', description: data.detail || data.error || `HTTP ${res.status}`, variant: 'destructive' })
      } else {
        setProfiles(prev => prev.map(p => (p.id === id ? { ...p, ...data.profile } : p)))
        toast({ title: 'Gespeichert', description: `${data.profile.full_name || data.profile.email}` })
      }
    } catch {
      toast({ title: 'Fehler', description: 'Speichern nicht möglich.', variant: 'destructive' })
    } finally {
      setSavingId(null)
    }
  }

  const byRole = (r: UserRole) => profiles.filter(p => p.role === r && p.is_active !== false).length

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Team &amp; Rollen</h1>
        <p className="text-sm text-slate-500">
          Lege fest, wer Opener, Setter, Closer oder Admin ist. Skripte und Einwandbehandlungen richten
          sich nach der Rolle.
        </p>
      </div>

      {/* Rollen-Übersicht */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map(r => {
          const M = ROLE_META[r]
          return (
            <Card key={r}>
              <CardContent className="p-4 text-center">
                <M.icon className={`h-5 w-5 mx-auto mb-1 ${M.cls}`} />
                <p className="text-2xl font-bold text-slate-900">{byRole(r)}</p>
                <p className="text-xs text-slate-500">{M.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Personen */}
      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {profiles.map(p => {
            const M = ROLE_META[p.role as UserRole] || ROLE_META.opener
            const inactive = p.is_active === false
            return (
              <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${inactive ? 'opacity-50' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}
                  style={{ backgroundColor: (p as any).color || '#64748b' }}>
                  {(p.full_name || p.email || '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 truncate">{p.full_name || p.email}</p>
                  <p className="text-xs text-slate-400 truncate">{p.email}{p.id === me.id ? ' · du' : ''}</p>
                </div>

                <Select value={p.role} onValueChange={(v) => patch(p.id, { role: v as UserRole })}>
                  <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline" size="sm"
                  onClick={() => patch(p.id, { is_active: inactive })}
                  className={inactive ? '' : 'text-green-700 border-green-200'}
                >
                  {savingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" />
                    : inactive ? 'Inaktiv' : <><Check className="h-4 w-4 mr-1" /> Aktiv</>}
                </Button>
              </div>
            )
          })}
          {profiles.length === 0 && (
            <p className="text-center text-slate-400 py-10">Keine Profile gefunden.</p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400">
        Hinweis: Wer sich hier neu einloggt, bekommt automatisch ein Profil. Rolle danach hier zuweisen.
        Der letzte aktive Admin kann sich die Admin-Rolle nicht selbst entziehen.
      </p>
    </div>
  )
}
