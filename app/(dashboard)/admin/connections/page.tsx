import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConnectionsClient } from '@/components/admin/ConnectionsClient'
import { getFlags, googleConfigured } from '@/lib/settings'
import { emailConfigured } from '@/lib/email/send'

export default async function ConnectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const nowIso = new Date().toISOString()

  // Supabase-Verbindung
  let supabaseOk = false
  try { const { error } = await supabase.from('leads').select('id', { head: true, count: 'exact' }).limit(1); supabaseOk = !error } catch {}

  const flags = await getFlags(supabase)

  const [remDue, mailsSendable, apptPending, failedLogs, lastRun] = await Promise.all([
    supabase.from('reminder_jobs').select('id', { head: true, count: 'exact' }).eq('status', 'pending').lte('send_at', nowIso),
    supabase.from('email_jobs').select('id', { head: true, count: 'exact' }).in('status', ['approved', 'draft']).not('to_email', 'is', null),
    supabase.from('appointments').select('id', { head: true, count: 'exact' }).eq('calendar_sync_status', 'pending'),
    supabase.from('automation_logs').select('id', { head: true, count: 'exact' }).eq('status', 'failed'),
    supabase.from('automation_logs').select('message, created_at, metadata_json').eq('action_type', 'job_run').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const health = {
    supabaseOk,
    emailConfigured: emailConfigured(),
    googleConfigured: googleConfigured(),
    cronConfigured: !!process.env.CRON_SECRET,
    counts: {
      remindersDue: remDue.count ?? 0,
      mailsSendable: mailsSendable.count ?? 0,
      apptPendingSync: apptPending.count ?? 0,
      failedLogs: failedLogs.count ?? 0,
    },
    lastRun: lastRun.data || null,
  }

  return <ConnectionsClient health={health} flags={flags} />
}
