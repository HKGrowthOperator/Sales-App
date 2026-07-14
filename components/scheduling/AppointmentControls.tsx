'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { rescheduleAppointment, cancelAppointment, markNoShow, markCompleted } from '@/lib/scheduling/appointmentActions'
import { isTerminalAppointmentStatus, APPOINTMENT_STATUS_LABEL, CALENDAR_SYNC_LABEL } from '@/lib/scheduling/status'
import { SlotPicker, SelectedSlot } from '@/components/scheduling/SlotPicker'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/hooks/use-toast'
import { CalendarClock, XCircle, UserX, CheckCircle, Loader2, X } from 'lucide-react'

interface ApptLike {
  id: string
  appointment_type: string
  status: string
  lead_id: string
  calendar_sync_status?: string | null
  assigned_user_id?: string | null
}

type Mode = 'reschedule' | 'cancel' | 'noshow' | null

export function AppointmentControls({ appt, actorUserId }: { appt: ApptLike; actorUserId: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(null)
  const [busy, setBusy] = useState(false)

  // Reschedule
  const [slot, setSlot] = useState<SelectedSlot | null>(null)
  // Cancel
  const [cancelReason, setCancelReason] = useState('')
  const [nextStatus, setNextStatus] = useState('Follow-up')
  const [sendMail, setSendMail] = useState(false)
  // No-Show
  const [followUpAt, setFollowUpAt] = useState('')
  const [noShowNote, setNoShowNote] = useState('')

  const roleType = appt.appointment_type === 'Closer-Call' ? 'closer' : 'setter'
  const terminal = isTerminalAppointmentStatus(appt.status)
  const statusBadge = APPOINTMENT_STATUS_LABEL[appt.status] || { label: appt.status, cls: 'bg-slate-100 text-slate-600' }
  const syncBadge = CALENDAR_SYNC_LABEL[appt.calendar_sync_status || 'internal_only'] || CALENDAR_SYNC_LABEL.internal_only

  function done(ok: boolean, msg: string) {
    setBusy(false)
    if (!ok) { toast({ title: 'Fehler', description: msg, variant: 'destructive' }); return }
    toast({ title: 'Erledigt', description: msg })
    setMode(null); setSlot(null); setCancelReason(''); setNoShowNote('')
    router.refresh()
  }

  async function doReschedule() {
    if (!slot) return
    setBusy(true)
    const res = await rescheduleAppointment({
      supabase: createClient(), appointmentId: appt.id, actorUserId,
      newStartAt: slot.startAt, newEndAt: slot.endAt, newAssignedUserId: slot.assignedUserId,
    })
    if (!res.ok && res.code === 'slot_taken') setSlot(null)
    done(res.ok, res.message)
  }
  async function doCancel() {
    if (!cancelReason.trim()) { toast({ title: 'Grund fehlt', variant: 'destructive' }); return }
    setBusy(true)
    const res = await cancelAppointment({ supabase: createClient(), appointmentId: appt.id, actorUserId, reason: cancelReason.trim(), nextLeadStatus: nextStatus, sendMail })
    done(res.ok, res.message)
  }
  async function doNoShow() {
    setBusy(true)
    const res = await markNoShow({ supabase: createClient(), appointmentId: appt.id, actorUserId, followUpAt: followUpAt ? new Date(followUpAt).toISOString() : undefined, note: noShowNote.trim() || undefined })
    done(res.ok, res.message)
  }
  async function doComplete() {
    setBusy(true)
    const res = await markCompleted({ supabase: createClient(), appointmentId: appt.id, actorUserId })
    done(res.ok, res.message)
  }

  return (
    <div className="space-y-2">
      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${statusBadge.cls}`}>{statusBadge.label}</span>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${syncBadge.cls}`}>{syncBadge.label}</span>
      </div>

      {/* Buttons */}
      {!terminal && mode === null && (
        <div className="flex flex-wrap gap-1.5 justify-end">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setMode('reschedule')}><CalendarClock className="h-3 w-3" /> Verschieben</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-amber-700 border-amber-200" onClick={() => setMode('noshow')}><UserX className="h-3 w-3" /> No-Show</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 border-red-200" onClick={() => setMode('cancel')}><XCircle className="h-3 w-3" /> Absagen</Button>
          <Button size="sm" className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={doComplete} disabled={busy}><CheckCircle className="h-3 w-3" /> Erledigt</Button>
        </div>
      )}

      {/* Panels */}
      {mode && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {mode === 'reschedule' ? 'Termin verschieben' : mode === 'cancel' ? 'Termin absagen' : 'No-Show markieren'}
            </span>
            <button onClick={() => setMode(null)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>

          {mode === 'reschedule' && (
            <>
              <SlotPicker roleType={roleType} selected={slot} onSelect={setSlot} />
              <Button size="sm" className="w-full gap-1" disabled={!slot || busy} onClick={doReschedule}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />} Neuen Termin buchen
              </Button>
            </>
          )}

          {mode === 'cancel' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Grund *</Label>
                <Textarea rows={2} value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="resize-none text-sm" placeholder="z.B. Kunde hat abgesagt, kein Bedarf mehr…" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Lead-Status danach</Label>
                <Select value={nextStatus} onValueChange={setNextStatus}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Follow-up', 'Später erneut kontaktieren', 'Verloren', 'Nicht passend', 'Interessiert'].map(s => (
                      <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={sendMail} onChange={e => setSendMail(e.target.checked)} className="w-3.5 h-3.5" />
                Absage-Mail als Preview erzeugen
              </label>
              <Button size="sm" variant="destructive" className="w-full gap-1" disabled={busy} onClick={doCancel}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Absagen
              </Button>
            </>
          )}

          {mode === 'noshow' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Follow-up am (Standard: +2 Tage)</Label>
                <Input type="datetime-local" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notiz</Label>
                <Textarea rows={2} value={noShowNote} onChange={e => setNoShowNote(e.target.value)} className="resize-none text-sm" placeholder="Optional…" />
              </div>
              <p className="text-[11px] text-slate-500">No-Show ≠ Lost: Lead geht auf Follow-up, Aufgabe + Reaktivierungs-Mail werden erzeugt.</p>
              <Button size="sm" className="w-full gap-1 bg-amber-500 hover:bg-amber-600" disabled={busy} onClick={doNoShow}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />} No-Show + Follow-up
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
