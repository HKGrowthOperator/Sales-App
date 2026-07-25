import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCalendarEvent, buildCalendarInputFromAppointment } from '@/lib/integrations/google-calendar'

export async function POST(request: NextRequest) {
  // 1. Auth prüfen — nur closer und admin dürfen Calendar-Events erstellen
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['closer', 'admin'].includes(profile.role)) {
    return NextResponse.json(
      { error: 'Keine Berechtigung — nur Closer und Admin können Kalender-Events erstellen' },
      { status: 403 }
    )
  }

  // 2. Body parsen
  let appointmentId: string
  try {
    const body = await request.json()
    appointmentId = body.appointment_id
    if (!appointmentId) throw new Error('appointment_id fehlt')
  } catch {
    return NextResponse.json(
      { error: 'Ungültiger Request-Body. Erwartet: { "appointment_id": "uuid" }' },
      { status: 400 }
    )
  }

  // 3. Appointment + Lead laden und Calendar-Input aufbauen
  const buildResult = await buildCalendarInputFromAppointment(appointmentId)

  if ('error' in buildResult) {
    return NextResponse.json({ error: buildResult.error }, { status: 400 })
  }

  // 4. Google Calendar Event erstellen
  const result = await createCalendarEvent(buildResult.input, {
    lead_id: buildResult.leadId,
    user_id: profile.id,
    assigned_user_id: buildResult.assignedUserId,
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, detail: 'Fehler wurde in integration_logs gespeichert.' },
      { status: 502 }
    )
  }

  return NextResponse.json({
    success: true,
    calendar_event_id: result.calendar_event_id,
  })
}
