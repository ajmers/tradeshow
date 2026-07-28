import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { ZodError } from 'zod'
import { env } from '@/lib/env'
import { responseTime } from '@/middleware/responseTime'
import { healthRoute } from '@/routes/health'
import { itemsRoute } from '@/routes/items'
import { wallsRoute } from '@/routes/walls'
import { boothsRoute } from '@/routes/booths'
import { wallAssignmentsRoute } from '@/routes/wall-assignments'

const app = new Hono()

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
app.route('/api/items', itemsRoute)
app.route('/api/walls', wallsRoute)
app.route('/api/booths', boothsRoute)
app.route('/api/wall-assignments', wallAssignmentsRoute)

if (env.NODE_ENV === 'production') {
  const clientDist = '../client/dist'
  app.use('/*', serveStatic({ root: clientDist }))
  app.get('*', serveStatic({ path: `${clientDist}/index.html` }))
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`)
})
