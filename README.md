# Tradeshow

A gallery/tradeshow inventory management app: React (Vite) frontend, split across
two backends as part of an in-progress migration, shared types between client and
server, all in one pnpm workspace.

Each user's data lives in one of two places:

- **Airtable**, for users an admin has assigned an Airtable base to (the original
  model — see `airtable/`).
- **Postgres** (Supabase), for everyone else — a self-serve signup gets a personal
  Postgres-backed workspace immediately, with the exact same API shape as an
  Airtable-backed one. An admin can assign an Airtable base to a Postgres-tenant
  user at any time as an upgrade (see `server-phoenix/lib/tradeshow_web/plugs/require_auth.ex`
  and the `*.Airtable` / `*.Postgres` submodules under `server-phoenix/lib/tradeshow/`).

Auth (sign in/up, password reset) and the Postgres tenant data both live in the
same Supabase project.

## Stack

- **Client**: React 19, Vite, React Router, TanStack Query, Supabase Auth
- **Primary server**: Phoenix (Elixir) — `server-phoenix/`, deployed on Render.
  No Ecto/Repo — talks to Airtable's REST API and to Supabase (Postgres + Storage)
  both over HTTP via `Req`.
- **Legacy server**: Hono on Node (`server/`) — deployed as a Vercel function.
  Mid-migration to Phoenix; routes already migrated (health, consigners, base,
  sales, walls, booths, admin, items, wall-assignments, floor-placements — see
  `vercel.json`'s rewrites) are dead code here in production but left in place
  rather than deleted. Don't add new features here.
- **Data**: Supabase (Postgres + Auth + Storage) and Airtable, per-user (see above)
- **Shared**: Zod schemas / TS types used by the client and (conceptually) mirrored
  by the Phoenix API's JSON shape
- **Tooling**: TypeScript, ESLint (flat config), Prettier, pnpm workspaces, Elixir/Mix

## Requirements

- Node 22+
- pnpm (via [Corepack](https://nodejs.org/api/corepack.html) or installed globally)
- Elixir/Erlang (for `server-phoenix`) — see `server-phoenix/mix.exs` for the
  required Elixir version
- A Supabase project (Postgres + Auth + Storage) and an Airtable PAT

## Getting started

1. Copy the env files and fill in real values:
   - `client/.env.example` → `client/.env.local`
   - `server/.env.example` → `server/.env`
   - `server-phoenix/.env.example` (if present, otherwise create `server-phoenix/.env`
     following `server/.env.example`'s shape) — needs `SUPABASE_URL`,
     `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `AIRTABLE_PAT`

2. Apply the Postgres migrations in `supabase/*.sql`, in order, against your
   Supabase project's SQL editor — there's no CLI/migration runner wired up, these
   are plain numbered files meant to be run manually (some, like `0001_profiles.sql`,
   have inline instructions for a one-time manual step).

3. Install and run everything (three processes, so three terminals):

   ```bash
   pnpm install
   pnpm dev                                  # Node server (:3000) + Vite client (:5173)
   (cd server-phoenix && mix setup && mix phx.server)   # Phoenix (:4000)
   ```

Open **http://localhost:5173**. The Vite dev server proxies API requests to
whichever backend currently owns that route — see the `proxy` block in
`client/vite.config.ts` — most routes go to Phoenix (`:4000`); anything not yet
migrated falls through to the Node server (`:3000`). Keep this in sync with
`vercel.json`'s production rewrites when a route moves from one backend to the
other, or requests will silently hit the wrong server locally.

## Production

- **Client**: deployed to Vercel (`vercel.json`), which also proxies API routes to
  either the Phoenix backend on Render or its own bundled Node function (`api/`),
  per the same per-route split as local dev.
- **Phoenix**: deployed to Render (`render.yaml`), building from `server-phoenix/`.
- **Node** (`server/`): still built/deployed as part of the Vercel function, but
  only serves whatever routes haven't been migrated to Phoenix yet.

## Project structure

```
tradeshow/
  client/
    src/
      api/          # fetch functions (talk to /api/*)
      components/    # small reusable UI pieces
      features/      # feature-scoped components (auth, items, walls, ...)
      hooks/         # TanStack Query hooks
      pages/         # route-level components
      routes/        # React Router route definitions
  server/            # legacy Hono/Node backend — routes already on Phoenix are dead code here
    src/
      routes/        # Hono route handlers
      middleware/     # Hono middleware (auth, etc.)
      services/       # business logic used by routes
      lib/            # env/config, Airtable client, small utilities
  server-phoenix/    # primary backend
    lib/
      tradeshow/               # contexts — Airtable/Postgres submodules per entity
      tradeshow_web/
        controllers/
        plugs/                 # RequireAuth (resolves the tenant), RequireAdmin
  shared/
    src/
      schemas/       # Zod schemas + inferred types, imported by the client (the
                      # canonical wire shape both backends' JSON must match)
  supabase/          # numbered SQL migrations, run manually against the Supabase project
  airtable/          # Airtable base schema migrations (also run manually)
```

## Path aliases

Both `client` and `server` use TypeScript path aliases instead of relative imports:

- `@/*` → that package's own `src/`
- `@shared` / `@shared/*` → `shared/src`

Client-side these are resolved natively by Vite (`resolve.tsconfigPaths`); server-side by `tsx` (dev) and `tsup`/esbuild (build) reading the same `tsconfig.json`.

`shared` is a real pnpm workspace package (so its own dependencies, like `zod`, resolve correctly), but it has no build step — it's imported directly from source via the alias, and gets inlined into the server bundle at build time.

## Scripts

Run from the repo root (fans out to each package via `pnpm --filter`); Phoenix has its own `mix` tasks, run from `server-phoenix/`:

| Script | What it does |
| --- | --- |
| `pnpm dev` | Run the Node server + Vite client together with hot reload (Phoenix is separate — see Getting started) |
| `pnpm build` | Build the Node server (tsup) and client (Vite) for production |
| `pnpm start` | Run the built Node server |
| `pnpm typecheck` | Type-check server and client (`tsc --noEmit`) |
| `pnpm lint` | Lint the whole repo |
| `pnpm format` | Format the whole repo with Prettier |
| `mix setup` | Install Phoenix deps |
| `mix phx.server` | Run Phoenix with hot reload |
| `mix precommit` | Compile with warnings-as-errors, drop unused deps, format, test — run before committing Phoenix changes |

## Adding an API endpoint (Phoenix)

New work should go into `server-phoenix`, not the legacy Node server. Each entity
follows the same shape (see `server-phoenix/lib/tradeshow/booths.ex` for a
complete example):

1. If it's a new table, add columns to `shared/src/schemas/` first — that's the
   single source of truth for the wire shape both tenant types must produce (an
   `{ id, createdTime, fields: {...} }` envelope with Airtable's original field
   names, regardless of which backend actually serves it).
2. In `server-phoenix/lib/tradeshow/<entity>.ex`: a thin dispatcher module that
   pattern-matches on the tenant (`{:airtable, base_id}` vs `{:postgres, user_id}`)
   and delegates to an `<Entity>.Airtable` or `<Entity>.Postgres` submodule.
   - The `.Airtable` submodule calls straight into `Tradeshow.Airtable`.
   - The `.Postgres` submodule calls `Tradeshow.Postgres` (a generic PostgREST
     client) and maps rows to/from the same envelope shape via
     `Tradeshow.Postgres.Envelope` — add the new table to `supabase/000N_*.sql`
     with RLS scoped to `user_id = auth.uid()`, matching the existing tables.
3. Add a controller under `server-phoenix/lib/tradeshow_web/controllers/`, using
   `conn.assigns.tenant` and `conn.assigns.user_token` (set by `RequireAuth`)
   rather than a bare Airtable base id.
4. Wire it up in `server-phoenix/lib/tradeshow_web/router.ex`.
5. Add the route to `vercel.json`'s rewrites and to `client/vite.config.ts`'s dev
   proxy (both need it, or it'll only work in one of local dev / production).
6. On the client: a fetch function in `client/src/api/`, a hook in
   `client/src/hooks/` (via `useQuery`/`useMutation`), consumed from a component
   in `client/src/features/` or `client/src/pages/`.
