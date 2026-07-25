import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MailTemplatesClient } from '@/components/admin/MailTemplatesClient'

export const dynamic = 'force-dynamic'

export default async function MailTemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role !== 'admin') redirect('/dashboard')

  const { data } = await supabase
    .from('email_templates')
    .select('id, key, product_area, subject, body_text, is_active')
    .order('key')

  return <MailTemplatesClient initial={(data || []) as any} />
}
