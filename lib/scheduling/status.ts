// ============================================================
// Zentrale Appointment-Status-Definition.
// EINE Quelle der Wahrheit — keine Magic Strings im Code.
// Die DB nutzt den deutschen appointment_status-Enum.
// ============================================================

export const APPOINTMENT_STATUS = {
  PLANNED:   'Geplant',
  CONFIRMED: 'Bestätigt',
  COMPLETED: 'Stattgefunden',
  CANCELLED: 'Abgesagt',
  NO_SHOW:   'No-Show',
} as const

export type AppointmentStatusValue = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS]

// Belegen einen Slot (verhindern Doppelbuchung). Muss zum partiellen
// Unique-Index appt_no_double_book passen!
export const BLOCKING_APPOINTMENT_STATUSES: AppointmentStatusValue[] = [
  APPOINTMENT_STATUS.PLANNED,
  APPOINTMENT_STATUS.CONFIRMED,
]

// Nicht blockierend: Abgesagt, No-Show, Stattgefunden (Vergangenheit).
// "Stattgefunden" ist bewusst NICHT blockierend, da es nur vergangene
// Termine betrifft und für künftige Slotberechnung irrelevant ist.
export function isBlockingAppointmentStatus(status: string | null | undefined): boolean {
  return !!status && (BLOCKING_APPOINTMENT_STATUSES as string[]).includes(status)
}

export const TERMINAL_APPOINTMENT_STATUSES: AppointmentStatusValue[] = [
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.NO_SHOW,
]
export function isTerminalAppointmentStatus(status: string | null | undefined): boolean {
  return !!status && (TERMINAL_APPOINTMENT_STATUSES as string[]).includes(status)
}

// ── Calendar-Sync-Status (ehrliche Anzeige in der UI) ──
export const CALENDAR_SYNC = {
  INTERNAL_ONLY: 'internal_only',       // Google nicht verbunden
  NOT_CONNECTED: 'calendar_not_connected',
  PENDING:       'pending',             // Sync ausstehend
  SYNCED:        'synced',              // Event erstellt/geprüft
  FAILED:        'failed',              // Sync fehlgeschlagen → Retry
} as const

export type CalendarSyncValue = string

export const CALENDAR_SYNC_LABEL: Record<string, { label: string; cls: string }> = {
  internal_only:          { label: 'Intern gebucht', cls: 'bg-slate-100 text-slate-600' },
  calendar_not_connected: { label: 'Google nicht verbunden', cls: 'bg-slate-100 text-slate-500' },
  pending:                { label: 'Google-Sync ausstehend', cls: 'bg-amber-100 text-amber-700' },
  synced:                 { label: '✓ Google geprüft', cls: 'bg-green-100 text-green-700' },
  failed:                 { label: 'Sync fehlgeschlagen', cls: 'bg-red-100 text-red-700' },
}

// ── Appointment-Status → UI-Badge ──
export const APPOINTMENT_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  'Geplant':       { label: 'Geplant', cls: 'bg-blue-100 text-blue-700' },
  'Bestätigt':     { label: 'Bestätigt', cls: 'bg-cyan-100 text-cyan-700' },
  'Stattgefunden': { label: 'Erledigt', cls: 'bg-green-100 text-green-700' },
  'Abgesagt':      { label: 'Abgesagt', cls: 'bg-slate-100 text-slate-500' },
  'No-Show':       { label: 'No-Show', cls: 'bg-red-100 text-red-700' },
}
