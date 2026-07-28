import { Hono } from 'hono'
import { listWalls } from '@/services/walls.service'
import { requireAuth } from '@/middleware/auth'
import type { AppEnv } from '@/lib/hono'

export const wallsRoute = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const walls = await listWalls(c.get('airtableBaseId'))
    return c.json(walls)
  })
