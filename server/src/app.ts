import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { ZodError } from 'zod'
import { responseTime } from '@/middleware/responseTime'
import { healthRoute } from '@/routes/health'
import { baseRoute } from '@/routes/base'
import { adminRoute } from '@/routes/admin'
import { itemsRoute } from '@/routes/items'
import { wallsRoute } from '@/routes/walls'
import { boothsRoute } from '@/routes/booths'
import { wallAssignmentsRoute } from '@/routes/wall-assignments'
import { floorPlacementsRoute } from '@/routes/floorPlacements'
import { salesRoute } from '@/routes/sales'
import { consignersRoute } from '@/routes/consigners'

export const app = new Hono()

app.use(logger())
app.use(responseTime)

app.onError((err, c) => {
  if (err instanceof ZodError) {
    return c.json({ error: 'Validation failed', issues: err.issues }, 400)
  }
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

app.route('/api/health', healthRoute)
app.route('/api/base', baseRoute)
app.route('/api/admin', adminRoute)
app.route('/api/items', itemsRoute)
app.route('/api/walls', wallsRoute)
app.route('/api/booths', boothsRoute)
app.route('/api/wall-assignments', wallAssignmentsRoute)
app.route('/api/floor-placements', floorPlacementsRoute)
app.route('/api/sales', salesRoute)
app.route('/api/consigners', consignersRoute)
