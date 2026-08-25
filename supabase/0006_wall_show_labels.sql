-- "Show labels" feature: item labels on a wall canvas are hidden by default.
-- A wall can opt in for all its items; a placed item can then still override
-- that in either direction. See shared/src/schemas/wall.ts ("Show Labels")
-- and wallAssignment.ts ("Label Hidden" / "Label Shown").

alter table public.walls
  add column show_labels boolean not null default false;

alter table public.wall_assignments
  add column label_shown boolean not null default false;
