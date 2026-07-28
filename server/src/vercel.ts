import { app } from '@/app'

// Hono's own `.fetch` is already a standalone Web-standard (Request) => Response
// handler (the same one used for Cloudflare Workers etc.) — export it directly
// rather than going through the `hono/vercel` `handle()` adapter, which has
// known issues on Vercel's Node runtime where requests hang with no response.
export default app.fetch
