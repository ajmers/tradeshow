import { Hono } from 'hono'
import { createItemInputSchema, updateItemInputSchema, uploadItemPhotoInputSchema } from '@shared'
import {
  listItems,
  createItem,
  updateItem,
  deleteItem,
  uploadItemPhoto,
} from '@/services/items.service'
import { requireAuth } from '@/middleware/auth'
import { countHit } from '@/lib/requestCounters'
import type { AppEnv } from '@/lib/hono'

export const itemsRoute = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const baseId = c.get('airtableBaseId')
    const hits = countHit('GET /items', baseId)
    console.log(`[GET /items] hit #${hits} for base ${baseId}`)
    const items = await listItems(baseId)
    return c.json(items)
  })
  .post('/', async (c) => {
    const input = createItemInputSchema.parse(await c.req.json())
    const item = await createItem(c.get('airtableBaseId'), input)
    return c.json(item, 201)
  })
  .patch('/:id', async (c) => {
    const input = updateItemInputSchema.parse(await c.req.json())
    const item = await updateItem(c.get('airtableBaseId'), c.req.param('id'), input)
    return c.json(item)
  })
  .delete('/:id', async (c) => {
    await deleteItem(c.get('airtableBaseId'), c.req.param('id'))
    return c.body(null, 204)
  })
  .post('/:id/photos', async (c) => {
    const input = uploadItemPhotoInputSchema.parse(await c.req.json())
    const item = await uploadItemPhoto(c.get('airtableBaseId'), c.req.param('id'), input)
    return c.json(item)
  })
