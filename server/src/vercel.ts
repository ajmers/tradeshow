import { app } from '@/app'

// Vercel's Node runtime only recognizes the Web-standard fetch handler shape
// when the default export is an object with a `fetch` method — a bare function
// (e.g. `export default app.fetch`) is instead treated as a legacy Node
// `(req, res)` handler, which hangs (never calling `res.end()`) or throws when
// Hono tries to parse the relative `req.url` as an absolute URL.
export default { fetch: app.fetch }
