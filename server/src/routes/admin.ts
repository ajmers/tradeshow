import { Hono } from 'hono'
import { updateUserBaseInputSchema, updateUserFeatureFlagsInputSchema } from '@shared'
import { listAdminUsers, listAdminBases, setUserBase, setUserFeatureFlags } from '@/services/admin.service'
import { requireAuth, requireAdmin } from '@/middleware/auth'
import type { AppEnv } from '@/lib/hono'

export const adminRoute = new Hono<AppEnv>()
  .use('*', requireAuth, requireAdmin)
  .get('/users', async (c) => {
    const users = await listAdminUsers()
    return c.json(users)
  })
  .get('/bases', async (c) => {
    const bases = await listAdminBases()
    return c.json(bases)
  })
  .patch('/users/:id', async (c) => {
    const input = updateUserBaseInputSchema.parse(await c.req.json())
    const bases = await listAdminBases()
    if (!bases.some((base) => base.id === input.airtableBaseId)) {
      return c.json({ error: 'Unknown Airtable base id' }, 400)
    }
    await setUserBase(c.req.param('id'), input.airtableBaseId)
    return c.json({ ok: true })
  })
  .patch('/users/:id/feature-flags', async (c) => {
    const input = updateUserFeatureFlagsInputSchema.parse(await c.req.json())
    try {
      await setUserFeatureFlags(c.req.param('id'), input.featureFlags)
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : 'Failed to update feature flags' }, 400)
    }
    return c.json({ ok: true })
  })
