import { Hono } from 'hono'
import { createWallInputSchema } from '@shared'
import { listWalls, createWall } from '@/services/walls.service'
import { requireAuth } from '@/middleware/auth'
import type { AppEnv } from '@/lib/hono'

export const wallsRoute = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const walls = await listWalls(c.get('airtableBaseId'))
    return c.json(walls)
  })
  .post('/', async (c) => {
    const input = createWallInputSchema.parse(await c.req.json())
    const wall = await createWall(c.get('airtableBaseId'), input)
    return c.json(wall, 201)
  })
