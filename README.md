# Tradeshow

A gallery/tradeshow inventory management app: React (Vite) frontend, Phoenix
(Elixir) backend, shared types between them, in a pnpm workspace (the client
and shared packages; Phoenix is a separate Elixir/Mix project alongside them).

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
- **Server**: Phoenix (Elixir) — `server-phoenix/`, deployed on Render. No
  Ecto/Repo — talks to Airtable's REST API and to Supabase (Postgres + Storage)
  both over HTTP via `Req`.
- **Data**: Supabase (Postgres + Auth + Storage) and Airtable, per-user (see above)
- **Shared**: Zod schemas / TS types imported by the client — also the canonical
  wire shape the Phoenix API's JSON must match, for both tenant types
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
   - `server-phoenix/.env.example` (if present, otherwise create `server-phoenix/.env`)
     — needs `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
     `AIRTABLE_PAT`

2. Apply the Postgres migrations in `supabase/*.sql`, in order, against your
   Supabase project's SQL editor — there's no CLI/migration runner wired up, these
   are plain numbered files meant to be run manually (some, like `0001_profiles.sql`,
   have inline instructions for a one-time manual step).

3. Install and run everything (two processes, so two terminals):

   ```bash
   pnpm install
   pnpm dev                                            # Vite client (:5173)
   (cd server-phoenix && mix setup && mix phx.server)  # Phoenix (:4000)
   ```

Open **http://localhost:5173**. The Vite dev server proxies all `/api/*`
requests to Phoenix (`:4000`) — see `client/vite.config.ts`.

## Production

- **Client**: deployed to Vercel (`vercel.json`), which also rewrites `/api/*` to
  the Phoenix backend on Render.
- **Phoenix**: deployed to Render (`render.yaml`), building from `server-phoenix/`.

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
  server-phoenix/
    lib/
      tradeshow/               # contexts — Airtable/Postgres submodules per entity
      tradeshow_web/
        controllers/
        plugs/                 # RequireAuth (resolves the tenant), RequireAdmin
  shared/
    src/
      schemas/       # Zod schemas + inferred types, imported by the client (the
                      # canonical wire shape the Phoenix API's JSON must match)
  supabase/          # numbered SQL migrations, run manually against the Supabase project
  airtable/          # Airtable base schema migrations (also run manually)
```

## Path aliases

The client uses TypeScript path aliases instead of relative imports:

- `@/*` → `client/src/*`
- `@shared` / `@shared/*` → `shared/src`

These are resolved natively by Vite (`resolve.tsconfigPaths`), reading `client/tsconfig.json`.

`shared` is a real pnpm workspace package (so its own dependencies, like `zod`, resolve correctly), but it has no build step — it's imported directly from source via the alias.

## Scripts

Run from the repo root (fans out to the client via `pnpm --filter`); Phoenix has its own `mix` tasks, run from `server-phoenix/`:

| Script | What it does |
| --- | --- |
| `pnpm dev` | Run the Vite client with hot reload (Phoenix is separate — see Getting started) |
| `pnpm build` | Build the client for production |
| `pnpm typecheck` | Type-check the client (`tsc --noEmit`) |
| `pnpm lint` | Lint the whole repo |
| `pnpm format` | Format the whole repo with Prettier |
| `mix setup` | Install Phoenix deps |
| `mix phx.server` | Run Phoenix with hot reload |
| `mix precommit` | Compile with warnings-as-errors, drop unused deps, format, test — run before committing Phoenix changes |

## Adding an API endpoint

Each entity follows the same shape (see `server-phoenix/lib/tradeshow/booths.ex`
for a complete example):

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
4. Wire it up in `server-phoenix/lib/tradeshow_web/router.ex` — no other routing
   config needed, since every `/api/*` path already reaches Phoenix.
5. On the client: a fetch function in `client/src/api/`, a hook in
   `client/src/hooks/` (via `useQuery`/`useMutation`), consumed from a component
   in `client/src/features/` or `client/src/pages/`.
