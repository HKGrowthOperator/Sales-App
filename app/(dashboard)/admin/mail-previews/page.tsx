import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MailPreviewsClient } from '@/components/admin/MailPreviewsClient'

export default async function MailPreviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const { data } = await supabase
    .from('email_jobs')
    .select('*, lead:leads(id, company_name, contact_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  return <MailPreviewsClient jobs={data || []} />
}
