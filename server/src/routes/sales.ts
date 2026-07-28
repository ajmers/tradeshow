import { Hono } from 'hono'
import { createSaleInputSchema } from '@shared'
import { listSales, createSale } from '@/services/sales.service'
import { requireAuth } from '@/middleware/auth'
import type { AppEnv } from '@/lib/hono'

export const salesRoute = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const sales = await listSales(c.get('airtableBaseId'))
    return c.json(sales)
  })
  .post('/', async (c) => {
    const input = createSaleInputSchema.parse(await c.req.json())
    const sale = await createSale(c.get('airtableBaseId'), input)
    return c.json(sale, 201)
  })
