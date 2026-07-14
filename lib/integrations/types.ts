export type IntegrationSystem = 'google_calendar' | 'resend' | 'hubspot' | 'webhook'

export type IntegrationStatus = 'pending' | 'success' | 'failed' | 'skipped'

export type CalendarSyncStatus = 'ausstehend' | 'synced' | 'failed'

export interface IntegrationLogEntry {
  event_type: string
  system: IntegrationSystem
  status: IntegrationStatus
  lead_id?: string | null
  user_id?: string | null
  appointment_id?: string | null
  payload?: Record<string, unknown>
  response?: Record<string, unknown>
  error_msg?: string
  retry_at?: string
}

export interface CalendarEventInput {
  appointment_id: string
  appointment_type: string
  appointment_at: string
  company_name: string
  contact_name: string | null
  role_title: string | null
  phone: string | null
  email: string | null
  website: string | null
  pain_guess: string | null
  entry_angle: string | null
  closer_name: string | null
  customer_email: string | null
  attendees: string[] | null
  opener_note: string | null
  setter_note: string | null
  setter_summary: string | null
  interest_topics: string[] | null
  decision_makers_needed: string | null
  notes: string | null
}

export interface CalendarEventResult {
  success: boolean
  calendar_event_id?: string
  error?: string
}
