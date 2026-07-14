import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RemindersClient } from '@/components/admin/RemindersClient'

export default async function RemindersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const { data } = await supabase
    .from('reminder_jobs')
    .select('*, lead:leads(id, company_name)')
    .order('send_at', { ascending: true })
    .limit(300)

  return <RemindersClient jobs={data || []} />
}
