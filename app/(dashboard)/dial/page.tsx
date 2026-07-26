import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DialerClient } from '@/components/leads/DialerClient'
import { selectScriptForLead, fetchObjectionsFor } from '@/lib/script-routing'
import { Lead, Profile, Script, ObjectionItem, RoleContext } from '@/lib/types'
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns'

export const dynamic = 'force-dynamic'

// Status, die in die Anruf-Warteschlange gehören (offene Kaltakquise).
const QUEUE_STATUSES = ['Zu kontaktieren', 'Nicht erreicht', 'Später erneut kontaktieren']

export default async function DialPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select(PROFILE_PUBLIC_COLUMNS).eq('id', user.id).single()
  if (!profile) redirect('/login')

  let query = supabase
    .from('leads')
    .select('*')
    .in('status', QUEUE_STATUSES)
    .eq('do_not_contact', false)
    .not('phone', 'is', null)
    // hohe Cross-Sell-Scores zuerst, dann am längsten nicht kontaktiert
    .order('cross_sell_score', { ascending: false, nullsFirst: false })
    .order('last_contact_at', { ascending: true, nullsFirst: true })
    .limit(200)

  // Nicht-Admins: nur eigene Leads (oder noch niemandem zugewiesen).
  if (profile.role !== 'admin') {
    query = query.or(`assigned_to.eq.${user.id},assigned_to.is.null`)
  }

  const { data: leads } = await query

  // Skript + Einwände für die Rolle laden, damit im Call nichts fehlt.
  // (Ein Skript für die ganze Warteschlange — der Einstiegswinkel des ersten
  //  Leads bestimmt die Variante; Personalisierung passiert je Lead im Panel.)
  const roleLabel: RoleContext =
    profile.role === 'setter' ? 'Setter' : profile.role === 'closer' ? 'Closer' : 'Opener'
  const firstAngle = (leads || [])[0]?.entry_angle ?? null

  const [script, objections] = await Promise.all([
    selectScriptForLead(supabase, { roleLabel, userId: user.id, entryAngle: firstAngle }),
    fetchObjectionsFor(supabase, roleLabel, firstAngle),
  ])

  return (
    <DialerClient
      profile={profile as Profile}
      initialQueue={(leads || []) as Lead[]}
      script={script as Script | null}
      objections={(objections || []) as ObjectionItem[]}
    />
  )
}
