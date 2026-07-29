-- Stores each user's uploaded Label Printer logo (as a data URL) on their profile,
-- so it's tied to their account instead of just one browser's localStorage. Existing
-- RLS policies on profiles (select/update own row) already cover this column.
alter table public.profiles
  add column label_logo_data_url text;
