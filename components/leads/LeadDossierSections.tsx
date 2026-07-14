'use client'

import { Card, CardContent } from '@/components/ui/card'
import { NextAction, SEVERITY_STYLE } from '@/lib/leads/nextAction'
import { TimelineEvent } from '@/lib/leads/timeline'
import { AppointmentControls } from '@/components/scheduling/AppointmentControls'
import { isBlockingAppointmentStatus, CALENDAR_SYNC_LABEL, APPOINTMENT_STATUS_LABEL } from '@/lib/scheduling/status'
import {
  ArrowRight, UserPlus, MessageSquare, CalendarClock, CalendarX, UserX,
  CheckCircle2, Bell, Mail, AlertTriangle, Clock, ListChecks, Radar,
} from 'lucide-react'

const fmt = (iso: string) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))

// ── Next Action Box ─────────────────────────────────────────────────────────
export function NextActionBox({ action }: { action: NextAction }) {
  const st = SEVERITY_STYLE[action.severity]
  return (
    <div className={`rounded-xl p-4 ${st.cls} flex items-center gap-3`}>
      <ArrowRight className="h-5 w-5 shrink-0 opacity-80" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Nächster Schritt</p>
        <p className="font-semibold leading-snug">{action.label}</p>
      </div>
    </div>
  )
}

// ── Timeline ────────────────────────────────────────────────────────────────
const ICONS: Record<string, any> = {
  lead: UserPlus, note: MessageSquare, calendar: CalendarClock, 'calendar-x': CalendarX,
  'user-x': UserX, check: CheckCircle2, followup: Clock, mail: Mail, bell: Bell, alert: AlertTriangle,
  radar: Radar,
}
const TONE: Record<string, string> = {
  default: 'text-slate-400 bg-slate-100', success: 'text-green-600 bg-green-100',
  warn: 'text-amber-600 bg-amber-100', error: 'text-red-600 bg-red-100',
}
export function LeadTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return <Empty icon={Clock} text="Noch keine Ereignisse" />
  return (
    <div className="space-y-0">
      {events.map((e, i) => {
        const Icon = ICONS[e.icon] || MessageSquare
        return (
          <div key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${TONE[e.tone]}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {i < events.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
            </div>
            <div className="pb-4 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">{e.title}</p>
                <span className="text-xs text-slate-400 shrink-0">{fmt(e.ts)}</span>
              </div>
              {e.detail && <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-line line-clamp-3">{e.detail}</p>}
              {e.actor && <p className="text-xs text-slate-400 mt-0.5">{e.actor}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Termine mit Controls ────────────────────────────────────────────────────
export function AppointmentsSection({ appointments, actorUserId }: { appointments: any[]; actorUserId: string }) {
  if (!appointments?.length) return <Empty icon={CalendarClock} text="Keine Termine" />
  const sorted = [...appointments].sort((a, b) => b.appointment_at.localeCompare(a.appointment_at))
  return (
    <div className="space-y-3">
      {sorted.map(a => {
        const active = isBlockingAppointmentStatus(a.status)
        const status = APPOINTMENT_STATUS_LABEL[a.status] || { label: a.status, cls: 'bg-slate-100 text-slate-600' }
        return (
          <Card key={a.id} className={active ? 'border-blue-200' : ''}>
            <CardContent className="p-4 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{a.appointment_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                </div>
                <p className="font-semibold text-slate-900">{fmt(a.appointment_at)}</p>
                {a.assigned_name && <p className="text-xs text-slate-500">→ {a.assigned_name}</p>}
                {a.notes && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{a.notes}</p>}
              </div>
              <div className="w-[260px]">
                <AppointmentControls appt={a} actorUserId={actorUserId} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ── Mails ───────────────────────────────────────────────────────────────────
export function MailsSection({ mails }: { mails: any[] }) {
  if (!mails?.length) return <Empty icon={Mail} text="Keine Mail-Previews" />
  return (
    <div className="space-y-2">
      {mails.map(m => (
        <Card key={m.id}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-slate-800">{m.subject}</span>
              <MailStatus status={m.status} />
            </div>
            <p className="text-xs text-slate-500">{m.type} · an {m.to_email || '—'} · {fmt(m.created_at)}</p>
            {m.body && <p className="text-xs text-slate-600 mt-2 whitespace-pre-line line-clamp-4 bg-slate-50 rounded p-2 border border-slate-100">{m.body}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
export function MailStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600', approved: 'bg-blue-100 text-blue-700', sent: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-400', blocked_missing_email: 'bg-amber-100 text-amber-700',
  }
  const label: Record<string, string> = { blocked_missing_email: 'keine E-Mail', draft: 'Entwurf', approved: 'freigegeben', sent: 'gesendet', failed: 'fehlgeschlagen', cancelled: 'storniert' }
  return <span className={`text-[11px] px-2 py-0.5 rounded-full ${map[status] || 'bg-slate-100 text-slate-600'}`}>{label[status] || status}</span>
}

// ── Follow-ups ──────────────────────────────────────────────────────────────
export function FollowupsSection({ followups }: { followups: any[] }) {
  if (!followups?.length) return <Empty icon={Clock} text="Keine Follow-ups" />
  return (
    <div className="space-y-2">
      {followups.map(f => {
        const overdue = f.status === 'offen' && new Date(f.due_at).getTime() < Date.now()
        return (
          <Card key={f.id} className={overdue ? 'border-red-200 bg-red-50/30' : ''}>
            <CardContent className="p-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{f.reason || f.type || 'Follow-up'}</p>
                <p className="text-xs text-slate-500">fällig {fmt(f.due_at)}{f.role_type ? ` · ${f.role_type}` : ''}</p>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${f.status === 'erledigt' ? 'bg-green-100 text-green-700' : overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {f.status === 'erledigt' ? 'erledigt' : overdue ? 'überfällig' : 'offen'}
              </span>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ── Automation Logs ─────────────────────────────────────────────────────────
export function AutomationSection({ logs }: { logs: any[] }) {
  if (!logs?.length) return <Empty icon={ListChecks} text="Keine Automation-Logs" />
  return (
    <div className="space-y-1.5">
      {logs.map(l => {
        const failed = l.status === 'failed'
        return (
          <div key={l.id} className={`flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-lg border ${failed ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'}`}>
            <div className="min-w-0">
              <span className={`font-medium ${failed ? 'text-red-700' : 'text-slate-700'}`}>{l.action_type}</span>
              {l.message && <span className="text-slate-500"> — {l.message}</span>}
            </div>
            <span className="text-xs text-slate-400 shrink-0">{fmt(l.created_at)}</span>
          </div>
        )
      })}
    </div>
  )
}

function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-10 text-slate-400">
      <Icon className="h-9 w-9 mx-auto mb-2 opacity-20" />
      <p className="text-sm">{text}</p>
    </div>
  )
}
