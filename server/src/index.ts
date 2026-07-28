import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { env } from '@/lib/env'
import { responseTime } from '@/middleware/responseTime'
import { healthRoute } from '@/routes/health'

const app = new Hono()

app.use(logger())
app.use(responseTime)

app.route('/api/health', healthRoute)

if (env.NODE_ENV === 'production') {
  const clientDist = '../client/dist'
  app.use('/*', serveStatic({ root: clientDist }))
  app.get('*', serveStatic({ path: `${clientDist}/index.html` }))
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`)
})
