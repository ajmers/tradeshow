-- Per-user feature toggles (e.g. "3D Booth Planner"), set by admins on the Admin page.
-- Existing RLS policies on profiles (select/update own row) already cover this column.
alter table public.profiles
  add column feature_flags jsonb not null default '{}'::jsonb;
