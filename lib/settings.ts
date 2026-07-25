// Runtime-Feature-Flags aus app_settings (admin-schaltbar).
export type AppFlags = {
  email_sending_enabled: boolean
  auto_send_confirmations: boolean
  calendar_sync_enabled: boolean
  slack_notifications_enabled: boolean
}

const DEFAULTS: AppFlags = {
  email_sending_enabled: false,
  auto_send_confirmations: false,
  calendar_sync_enabled: false,
  slack_notifications_enabled: false,
}

export async function getFlags(supabase: any): Promise<AppFlags> {
  const { data } = await supabase.from('app_settings').select('key, value')
  const flags = { ...DEFAULTS }
  for (const row of data || []) {
    if (row.key in flags) (flags as any)[row.key] = row.value === true || row.value === 'true'
  }
  return flags
}

export function googleConfigured(): boolean {
  // Ein gemeinsamer GOOGLE_REFRESH_TOKEN ist nicht mehr nötig: jede Person
  // verbindet ihren eigenen Kalender unter Admin → Verfügbarkeit. Für die
  // Grundkonfiguration zählen nur noch Client-ID und -Secret.
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}
