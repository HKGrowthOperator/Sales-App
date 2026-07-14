// Script-Routing: persönlich-approved (Rolle+Winkel) > Master (Rolle+Winkel) > Master (Rolle).
// Funktioniert mit Server- oder Client-Supabase-Instanz.
import { Script, RoleContext, ObjectionItem } from '@/lib/types'

export async function selectScriptForLead(
  supabase: any,
  opts: { roleLabel: RoleContext; userId: string; entryAngle: string | null }
): Promise<Script | null> {
  const { roleLabel, userId, entryAngle } = opts

  if (entryAngle) {
    const { data: personal } = await supabase
      .from('scripts').select('*')
      .eq('script_type', 'personal').eq('owner_user_id', userId)
      .eq('role', roleLabel).eq('status', 'approved').eq('entry_angle', entryAngle)
      .limit(1).maybeSingle()
    if (personal) return personal as Script
  }

  // Persönliche approved Version ohne Winkel (generisch)
  const { data: personalGeneric } = await supabase
    .from('scripts').select('*')
    .eq('script_type', 'personal').eq('owner_user_id', userId)
    .eq('role', roleLabel).eq('status', 'approved').is('entry_angle', null)
    .limit(1).maybeSingle()
  if (personalGeneric && !entryAngle) return personalGeneric as Script

  if (entryAngle) {
    const { data: master } = await supabase
      .from('scripts').select('*')
      .eq('script_type', 'master').eq('role', roleLabel)
      .eq('status', 'approved').eq('entry_angle', entryAngle)
      .limit(1).maybeSingle()
    if (master) return master as Script
  }

  const { data: fallback } = await supabase
    .from('scripts').select('*')
    .eq('script_type', 'master').eq('role', roleLabel).eq('status', 'approved')
    .order('created_at', { ascending: true })
    .limit(1).maybeSingle()
  return (fallback as Script) || null
}

export async function fetchObjectionsFor(
  supabase: any,
  roleLabel: RoleContext,
  entryAngle: string | null
): Promise<ObjectionItem[]> {
  const { data } = await supabase
    .from('objection_library').select('*')
    .eq('is_active', true)
    .or(`role.is.null,role.eq.${roleLabel}`)
    .order('sort_order', { ascending: true })
  return ((data || []) as ObjectionItem[]).filter(
    o => o.entry_angle == null || o.entry_angle === entryAngle
  )
}
