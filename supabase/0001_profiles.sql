-- 1. Create the profiles table, one row per auth user, linking them to their Airtable base.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  airtable_base_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Lock it down: users can only ever see/edit their own row.
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Find your own user id (run this first, copy the id from the result).
select id, email from auth.users;

-- 4. Seed your own profile row with your current Airtable base id.
--    Replace YOUR-USER-ID-HERE with the id from step 3.
insert into public.profiles (id, airtable_base_id)
values ('YOUR-USER-ID-HERE', 'appn5TIo6JVK7OGZn');
