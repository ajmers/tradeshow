import type { AdminUser, FeatureFlags } from '@shared'
import { DEFAULT_FEATURE_FLAGS } from '@shared'
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
    .select('id, airtable_base_id, feature_flags')
  if (profilesError) {
    throw new Error(profilesError.message)
  }

  const profileByUserId = new Map(profiles.map((profile) => [profile.id, profile]))

  return authData.users.map((user) => {
    const profile = profileByUserId.get(user.id)
    return {
      id: user.id,
      email: user.email ?? null,
      airtableBaseId: profile?.airtable_base_id ?? null,
      isAdmin: user.app_metadata?.is_admin === true,
      featureFlags: {
        ...DEFAULT_FEATURE_FLAGS,
        ...(profile?.feature_flags as Partial<FeatureFlags> | null),
      },
    }
  })
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

export async function setUserFeatureFlags(
  userId: string,
  featureFlags: Partial<FeatureFlags>,
): Promise<void> {
  // Unlike setUserBase, this doesn't upsert: a feature flag is meaningless for a user
  // with no Airtable base assigned yet, so require the profiles row (and its base)
  // to already exist rather than silently creating a base-less one.
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('feature_flags')
    .eq('id', userId)
    .maybeSingle()
  if (fetchError) {
    throw new Error(fetchError.message)
  }
  if (!profile) {
    throw new Error('Assign an Airtable base to this user before enabling features for them.')
  }

  const mergedFlags = {
    ...(profile.feature_flags as Partial<FeatureFlags> | null),
    ...featureFlags,
  }
  const { error } = await supabaseAdmin.from('profiles').update({ feature_flags: mergedFlags }).eq('id', userId)
  if (error) {
    throw new Error(error.message)
  }
}
