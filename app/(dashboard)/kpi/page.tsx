import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, PhoneCall, Flame, CalendarCheck, Trophy, TrendingUp } from 'lucide-react'
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns'

export const dynamic = 'force-dynamic'

// ============================================================
// KPI-Tracking pro Person (Sales App v1.1)
// ------------------------------------------------------------
// Aggregiert aus call_notes (+ leads für Abschlüsse):
//   Anrufe · Erreicht · Interessiert · Termine · Gewonnen · Quote
// Admin sieht das ganze Team; andere nur sich selbst.
// ============================================================

const REACHED_EXCLUDE = new Set(['Nicht erreicht'])
const INTERESTED = new Set(['Interessiert', 'Qualifiziert für Closer'])
const APPOINTMENT = new Set(['Termin vereinbart'])

type Row = {
  id: string
  name: string
  role: string
  calls: number
  reached: number
  interested: number
  appointments: number
  won: number
}

export default async function KpiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select(PROFILE_PUBLIC_COLUMNS).eq('id', user.id).single()
  if (!profile) redirect('/login')

  const isAdmin = profile.role === 'admin'

  const [{ data: profiles }, { data: notes }, { data: leads }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, is_active'),
    supabase.from('call_notes').select('user_id, call_result, appointment_requested, created_at'),
    supabase.from('leads').select('assigned_to, closer, status'),
  ])

  const people = (profiles || []).filter(p => isAdmin || p.id === profile.id)
  const rowById = new Map<string, Row>()
  for (const p of people) {
    rowById.set(p.id, {
      id: p.id,
      name: p.full_name || p.email || '—',
      role: p.role,
      calls: 0, reached: 0, interested: 0, appointments: 0, won: 0,
    })
  }

  for (const n of notes || []) {
    const r = rowById.get(n.user_id as string)
    if (!r) continue
    r.calls++
    if (n.call_result && !REACHED_EXCLUDE.has(n.call_result)) r.reached++
    if (n.call_result && INTERESTED.has(n.call_result)) r.interested++
    if ((n.call_result && APPOINTMENT.has(n.call_result)) || n.appointment_requested) r.appointments++
  }

  for (const l of leads || []) {
    if (l.status !== 'Gewonnen') continue
    const owner = (l.closer as string) || (l.assigned_to as string)
    const r = owner ? rowById.get(owner) : null
    if (r) r.won++
  }

  const rows = Array.from(rowById.values()).sort((a, b) => b.calls - a.calls)

  // Team-Summe (nur Admin)
  const totals = rows.reduce(
    (acc, r) => {
      acc.calls += r.calls; acc.reached += r.reached; acc.interested += r.interested
      acc.appointments += r.appointments; acc.won += r.won
      return acc
    },
    { calls: 0, reached: 0, interested: 0, appointments: 0, won: 0 },
  )

  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)

  const metrics = [
    { key: 'calls', label: 'Anrufe', icon: Phone, cls: 'text-slate-600' },
    { key: 'reached', label: 'Erreicht', icon: PhoneCall, cls: 'text-blue-600' },
    { key: 'interested', label: 'Interessiert', icon: Flame, cls: 'text-orange-600' },
    { key: 'appointments', label: 'Termine', icon: CalendarCheck, cls: 'text-violet-600' },
    { key: 'won', label: 'Gewonnen', icon: Trophy, cls: 'text-green-600' },
  ] as const

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KPIs {isAdmin ? '— Team' : '— Meine Zahlen'}</h1>
        <p className="text-sm text-slate-500">
          {isAdmin ? 'Leistung pro Person aus protokollierten Anrufen.' : 'Deine protokollierten Anrufe und Ergebnisse.'}
        </p>
      </div>

      {/* Kennzahl-Kacheln (Summe) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {metrics.map(m => (
          <Card key={m.key}>
            <CardContent className="p-4 text-center">
              <m.icon className={`h-5 w-5 mx-auto mb-1 ${m.cls}`} />
              <p className="text-2xl font-bold text-slate-900">{totals[m.key]}</p>
              <p className="text-xs text-slate-500">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        Erreichquote {pct(totals.reached, totals.calls)}% · Termin-Quote {pct(totals.appointments, totals.reached)}% (auf Erreichte)
      </div>

      {/* Tabelle pro Person */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left font-medium px-4 py-2.5">Person</th>
                <th className="text-right font-medium px-3 py-2.5">Anrufe</th>
                <th className="text-right font-medium px-3 py-2.5">Erreicht</th>
                <th className="text-right font-medium px-3 py-2.5">Interess.</th>
                <th className="text-right font-medium px-3 py-2.5">Termine</th>
                <th className="text-right font-medium px-3 py-2.5">Gewonnen</th>
                <th className="text-right font-medium px-4 py-2.5">Quote</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-slate-800">{r.name}</span>
                    <span className="ml-2 text-xs text-slate-400 capitalize">{r.role}</span>
                  </td>
                  <td className="text-right px-3 py-2.5 text-slate-700">{r.calls}</td>
                  <td className="text-right px-3 py-2.5 text-slate-700">{r.reached}</td>
                  <td className="text-right px-3 py-2.5 text-slate-700">{r.interested}</td>
                  <td className="text-right px-3 py-2.5 text-slate-700">{r.appointments}</td>
                  <td className="text-right px-3 py-2.5 font-semibold text-green-700">{r.won}</td>
                  <td className="text-right px-4 py-2.5 text-slate-500">{pct(r.reached, r.calls)}%</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="text-center text-slate-400 py-10">Noch keine Anrufe protokolliert.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-xs text-slate-400">
        Anrufe werden über den Power-Dialer und die Notiz-Formulare protokolliert. „Gewonnen" zählt Leads mit Status Gewonnen (Closer/zugewiesen).
      </p>
    </div>
  )
}
