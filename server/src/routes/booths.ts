import { Hono } from 'hono'
import { createBoothInputSchema, updateBoothInputSchema } from '@shared'
import { listBooths, createBooth, updateBooth } from '@/services/booths.service'
import { requireAuth } from '@/middleware/auth'
import type { AppEnv } from '@/lib/hono'

export const boothsRoute = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const booths = await listBooths(c.get('airtableBaseId'))
    return c.json(booths)
  })
  .post('/', async (c) => {
    const input = createBoothInputSchema.parse(await c.req.json())
    const booth = await createBooth(c.get('airtableBaseId'), input)
    return c.json(booth, 201)
  })
  .patch('/:id', async (c) => {
    const input = updateBoothInputSchema.parse(await c.req.json())
    const booth = await updateBooth(c.get('airtableBaseId'), c.req.param('id'), input)
    return c.json(booth)
  })
