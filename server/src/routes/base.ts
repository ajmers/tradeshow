import { Hono } from 'hono'
import { getBaseInfo } from '@/services/base.service'
import { requireAuth } from '@/middleware/auth'
import type { AppEnv } from '@/lib/hono'

export const baseRoute = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const info = await getBaseInfo(c.get('airtableBaseId'))
    return c.json(info)
  })
