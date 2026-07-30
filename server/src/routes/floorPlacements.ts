import { Hono } from 'hono'
import { createFloorPlacementInputSchema, updateFloorPlacementInputSchema } from '@shared'
import {
  listFloorPlacements,
  createFloorPlacement,
  updateFloorPlacement,
  deleteFloorPlacement,
} from '@/services/floorPlacements.service'
import { requireAuth } from '@/middleware/auth'
import type { AppEnv } from '@/lib/hono'

export const floorPlacementsRoute = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const placements = await listFloorPlacements(c.get('airtableBaseId'))
    return c.json(placements)
  })
  .post('/', async (c) => {
    const input = createFloorPlacementInputSchema.parse(await c.req.json())
    const placement = await createFloorPlacement(c.get('airtableBaseId'), input)
    return c.json(placement, 201)
  })
  .patch('/:id', async (c) => {
    const input = updateFloorPlacementInputSchema.parse(await c.req.json())
    const placement = await updateFloorPlacement(c.get('airtableBaseId'), c.req.param('id'), input)
    return c.json(placement)
  })
  .delete('/:id', async (c) => {
    await deleteFloorPlacement(c.get('airtableBaseId'), c.req.param('id'))
    return c.json({ ok: true })
  })
