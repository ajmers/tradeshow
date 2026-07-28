import { Hono } from 'hono'
import { createItemInputSchema, updateItemInputSchema, uploadItemPhotoInputSchema } from '@shared'
import {
  listItems,
  createItem,
  updateItem,
  deleteItem,
  uploadItemPhoto,
} from '@/services/items.service'

export const itemsRoute = new Hono()
  .get('/', async (c) => {
    const items = await listItems()
    return c.json(items)
  })
  .post('/', async (c) => {
    const input = createItemInputSchema.parse(await c.req.json())
    const item = await createItem(input)
    return c.json(item, 201)
  })
  .patch('/:id', async (c) => {
    const input = updateItemInputSchema.parse(await c.req.json())
    const item = await updateItem(c.req.param('id'), input)
    return c.json(item)
  })
  .delete('/:id', async (c) => {
    await deleteItem(c.req.param('id'))
    return c.body(null, 204)
  })
  .post('/:id/photos', async (c) => {
    const input = uploadItemPhotoInputSchema.parse(await c.req.json())
    const item = await uploadItemPhoto(c.req.param('id'), input)
    return c.json(item)
  })
