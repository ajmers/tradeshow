-- Postgres-backed data for users who don't have an Airtable base assigned
-- (see Tradeshow.Postgres / the *.Postgres context submodules on the Phoenix
-- side). Every table here mirrors an Airtable table used by the app, scoped
-- per-user via `user_id` + RLS instead of per-Airtable-base. Real foreign
-- keys (with `on delete cascade` where Airtable required manual cascade
-- deletes) replace Airtable's array-of-linked-record-id fields.

create table public.consigners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  consignment_rate numeric,
  created_at timestamptz not null default now()
);

create table public.booths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  event_start_date date,
  event_end_date date,
  booth_type text check (booth_type in ('Solo', 'Group', 'Gallery', 'Fair', 'Pop-Up', 'Other')),
  event_location text,
  organizer text,
  notes text,
  width numeric,
  depth numeric,
  height numeric,
  created_at timestamptz not null default now()
);

create table public.walls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  booth_id uuid not null references public.booths (id) on delete cascade,
  name text,
  height numeric,
  width numeric,
  unit_of_measure text,
  wall_color text,
  description text,
  location text,
  booth_surface text check (booth_surface in ('Front', 'Back', 'Left', 'Right')),
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consigner_id uuid references public.consigners (id) on delete set null,
  title text,
  artist text,
  description text,
  height numeric,
  width numeric,
  depth numeric,
  unit_of_measure text,
  framing_details text,
  date_acquired date,
  location text,
  condition text check (condition in ('Excellent', 'Good', 'Fair', 'Needs Restoration')),
  tags text[],
  list_price numeric,
  discount numeric,
  label text,
  label_title text,
  label_size text check (label_size in ('Small', 'Medium', 'Large', 'Full-page')),
  is_prop boolean not null default false,
  -- Each element shaped like shared/src/schemas/airtable.ts's airtableAttachmentSchema.
  images jsonb not null default '[]'::jsonb,
  cropped_image jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.wall_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wall_id uuid not null references public.walls (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  booth_id uuid not null references public.booths (id) on delete cascade,
  assignment text,
  x_position numeric,
  y_position numeric,
  rotation_angle numeric,
  label_x_position numeric,
  label_y_position numeric,
  label_hidden boolean not null default false,
  notes text,
  "order" integer,
  created_at timestamptz not null default now()
);

create table public.floor_placements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  booth_id uuid not null references public.booths (id) on delete cascade,
  placement text,
  x_position numeric,
  y_position numeric,
  rotation_angle numeric,
  created_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The Airtable "Venue" link — always a single booth in practice despite
  -- Airtable's array-of-linked-records shape (see Sales.Postgres mapper).
  booth_id uuid not null references public.booths (id) on delete cascade,
  sale_price numeric,
  date_sold date,
  sale_notes text,
  created_at timestamptz not null default now()
);

-- "Items (Sale History Link)" — a sale can cover more than one item.
create table public.sale_items (
  sale_id uuid not null references public.sales (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  primary key (sale_id, item_id)
);

create index on public.walls (booth_id);
create index on public.items (consigner_id);
create index on public.wall_assignments (wall_id);
create index on public.wall_assignments (item_id);
create index on public.wall_assignments (booth_id);
create index on public.floor_placements (item_id);
create index on public.floor_placements (booth_id);
create index on public.sales (booth_id);
create index on public.sale_items (item_id);

alter table public.consigners enable row level security;
alter table public.booths enable row level security;
alter table public.walls enable row level security;
alter table public.items enable row level security;
alter table public.wall_assignments enable row level security;
alter table public.floor_placements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

create policy "Users manage their own consigners"
  on public.consigners for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own booths"
  on public.booths for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own walls"
  on public.walls for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own items"
  on public.items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own wall assignments"
  on public.wall_assignments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own floor placements"
  on public.floor_placements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own sales"
  on public.sales for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- sale_items has no user_id of its own, so it's scoped through its parent sale.
create policy "Users manage their own sale items"
  on public.sale_items for all
  using (exists (
    select 1 from public.sales
    where sales.id = sale_items.sale_id and sales.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.sales
    where sales.id = sale_items.sale_id and sales.user_id = auth.uid()
  ));
