import { Hono } from 'hono'
import { listConsigners } from '@/services/consigners.service'
import { requireAuth } from '@/middleware/auth'
import type { AppEnv } from '@/lib/hono'

export const consignersRoute = new Hono<AppEnv>()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const consigners = await listConsigners(c.get('airtableBaseId'))
    return c.json(consigners)
  })
