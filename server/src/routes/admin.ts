import { Hono } from 'hono'
import { updateUserBaseInputSchema } from '@shared'
import { listAdminUsers, listAdminBases, setUserBase } from '@/services/admin.service'
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
