import type { MiddlewareHandler } from 'hono'

export const responseTime: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  await next()
  c.res.headers.set('X-Response-Time', `${Date.now() - start}ms`)
}
