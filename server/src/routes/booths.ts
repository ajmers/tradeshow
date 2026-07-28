import { Hono } from 'hono'
import { listBooths } from '@/services/booths.service'
import { requireAuth } from '@/middleware/auth'
import type { AppEnv } from '@/lib/hono'

export const boothsRoute = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const booths = await listBooths(c.get('airtableBaseId'))
    return c.json(booths)
  })
