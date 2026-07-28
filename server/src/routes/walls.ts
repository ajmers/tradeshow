import { Hono } from 'hono'
import { listWalls } from '@/services/walls.service'

export const wallsRoute = new Hono().get('/', async (c) => {
  const walls = await listWalls()
  return c.json(walls)
})
