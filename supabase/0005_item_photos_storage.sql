-- Private bucket for item photo uploads from Postgres-tenant users (Airtable
-- users still upload straight to Airtable's own attachment API, unchanged).
-- Objects are keyed "{user_id}/{item_id}/{filename}" — the folder-prefix
-- policy below is the standard Supabase Storage RLS pattern for scoping each
-- user to their own folder.

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', false)
on conflict (id) do nothing;

create policy "Users manage their own item photos"
  on storage.objects for all
  using (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'item-photos' and (storage.foldername(name))[1] = auth.uid()::text);
