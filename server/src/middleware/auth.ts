import type { MiddlewareHandler } from 'hono'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { AppEnv } from '@/lib/hono'

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('airtable_base_id')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile?.airtable_base_id) {
    return c.json({ error: 'No Airtable base configured for this account' }, 403)
  }

  c.set('airtableBaseId', profile.airtable_base_id)
  // Admin status lives in the auth user's app_metadata, not `profiles` — that table is
  // purely the user-to-base link, and app_metadata is only writable via the service-role
  // admin API, so a user can never grant it to themselves by editing their own row.
  c.set('isAdmin', userData.user.app_metadata?.is_admin === true)
  await next()
}

export const requireAdmin: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get('isAdmin')) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await next()
}
