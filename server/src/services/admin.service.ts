import type { AdminUser } from '@shared'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { listBases, type AirtableBaseSummary } from '@/lib/airtable'

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  })
  if (authError) {
    throw new Error(authError.message)
  }

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, airtable_base_id')
  if (profilesError) {
    throw new Error(profilesError.message)
  }

  const baseIdByUserId = new Map(profiles.map((profile) => [profile.id, profile.airtable_base_id]))

  return authData.users.map((user) => ({
    id: user.id,
    email: user.email ?? null,
    airtableBaseId: baseIdByUserId.get(user.id) ?? null,
    isAdmin: user.app_metadata?.is_admin === true,
  }))
}

export async function listAdminBases(): Promise<AirtableBaseSummary[]> {
  return listBases()
}

export async function setUserBase(userId: string, airtableBaseId: string): Promise<void> {
  // Not every auth user has a profiles row yet (nothing creates one automatically on
  // sign-up) — upsert so assigning a base for the first time creates it instead of
  // silently updating zero rows.
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: userId, airtable_base_id: airtableBaseId }, { onConflict: 'id' })
  if (error) {
    throw new Error(error.message)
  }
}
