import { createClient } from '@supabase/supabase-js'
import { IntegrationLogEntry } from './types'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set — required for integration logging')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export async function logIntegration(entry: IntegrationLogEntry): Promise<string | null> {
  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('integration_logs')
      .insert({
        event_type:     entry.event_type,
        system:         entry.system,
        status:         entry.status,
        lead_id:        entry.lead_id ?? null,
        user_id:        entry.user_id ?? null,
        appointment_id: entry.appointment_id ?? null,
        payload:        entry.payload ?? null,
        response:       entry.response ?? null,
        error_msg:      entry.error_msg ?? null,
        retry_at:       entry.retry_at ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[integration_log] Insert failed:', error.message)
      return null
    }
    return data.id
  } catch (err) {
    // Logging must never crash the main flow
    console.error('[integration_log] Unexpected error:', err)
    return null
  }
}

export async function updateLog(
  id: string,
  update: { status: IntegrationLogEntry['status']; response?: Record<string, unknown>; error_msg?: string }
): Promise<void> {
  try {
    const supabase = getServiceClient()
    await supabase
      .from('integration_logs')
      .update({
        status:     update.status,
        response:   update.response ?? null,
        error_msg:  update.error_msg ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
  } catch (err) {
    console.error('[integration_log] Update failed:', err)
  }
}
