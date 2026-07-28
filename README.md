# Tradeshow

A full-stack TypeScript application: React (Vite) frontend, Hono backend, shared types between them, all in one pnpm workspace.

## Stack

- **Client**: React 19, Vite, React Router, TanStack Query
- **Server**: Hono on Node (`@hono/node-server`)
- **Shared**: Zod schemas / TS types used by both sides
- **Tooling**: TypeScript, ESLint (flat config), Prettier, pnpm workspaces

## Requirements

- Node 22+
- pnpm (via [Corepack](https://nodejs.org/api/corepack.html) or installed globally)

## Getting started

```bash
pnpm install
pnpm dev
```

This starts both processes with hot reload:

- Server on **http://localhost:3000** (`tsx watch`, restarts on save)
- Client on **http://localhost:5173** (Vite, HMR)

The Vite dev server proxies `/api/*` requests to the Hono server, so the browser only ever talks to `http://localhost:5173`. Open that URL — the home page fetches `GET /api/health` via TanStack Query and shows `{ "status": "ok" }`.

## Production

```bash
pnpm build
pnpm start
```

- `pnpm build` bundles the server with `tsup` (`server/dist/index.js`) and builds the client with Vite (`client/dist/`).
- `pnpm start` runs only the Hono server. In `NODE_ENV=production` it also serves the built client (with SPA fallback to `index.html`) in addition to the API, so a single Node process handles everything — no separate static host needed.

## Project structure

```
tradeshow/
  client/
    src/
      api/         # fetch functions (talk to /api/*)
      components/   # small reusable UI pieces
      features/     # feature-scoped components (e.g. health check)
      hooks/        # TanStack Query hooks
      pages/        # route-level components
      routes/       # React Router route definitions
  server/
    src/
      index.ts      # app entrypoint, wiring routes/middleware
      routes/       # Hono route handlers
      middleware/    # Hono middleware
      services/     # business logic used by routes
      lib/           # env/config, small utilities
  shared/
    src/
      schemas/       # Zod schemas + inferred types, shared by client & server
```

## Path aliases

Both `client` and `server` use TypeScript path aliases instead of relative imports:

- `@/*` → that package's own `src/`
- `@shared` / `@shared/*` → `shared/src`

Client-side these are resolved natively by Vite (`resolve.tsconfigPaths`); server-side by `tsx` (dev) and `tsup`/esbuild (build) reading the same `tsconfig.json`.

`shared` is a real pnpm workspace package (so its own dependencies, like `zod`, resolve correctly), but it has no build step — it's imported directly from source via the alias, and gets inlined into the server bundle at build time.

## Scripts

Run from the repo root (fans out to each package via `pnpm --filter`):

| Script | What it does |
| --- | --- |
| `pnpm dev` | Run client + server together with hot reload |
| `pnpm build` | Build server (tsup) and client (Vite) for production |
| `pnpm start` | Run the built server (serves API + static client in prod) |
| `pnpm typecheck` | Type-check server and client (`tsc --noEmit`) |
| `pnpm lint` | Lint the whole repo |
| `pnpm format` | Format the whole repo with Prettier |

## Adding an API endpoint

1. Define/extend a Zod schema in `shared/src/schemas/` (this is the single source of truth for the shape).
2. Add a route handler in `server/src/routes/`, using a service in `server/src/services/` for any logic.
3. Mount the route in `server/src/index.ts`.
4. On the client, add a fetch function in `client/src/api/`, a hook in `client/src/hooks/` (via `useQuery`/`useMutation`), and consume it from a component in `client/src/features/` or `client/src/pages/`.
