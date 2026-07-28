import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { env } from '@/lib/env'
import { app } from '@/app'

// Only relevant for traditional Node hosting — Vercel serves the client build
// itself and never reaches this entry point.
if (env.NODE_ENV === 'production') {
  const clientDist = '../client/dist'
  app.use('/*', serveStatic({ root: clientDist }))
  app.get('*', serveStatic({ path: `${clientDist}/index.html` }))
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`)
})
