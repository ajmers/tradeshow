import { Hono } from 'hono'
import { listBooths } from '@/services/booths.service'

export const boothsRoute = new Hono().get('/', async (c) => {
  const booths = await listBooths()
  return c.json(booths)
})
