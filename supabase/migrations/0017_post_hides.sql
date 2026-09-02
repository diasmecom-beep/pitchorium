-- Pitchorium — migration 0017 : masquer une publication de son propre fil (privé, par profil).
-- A exécuter APRÈS 0001 à 0016. Additive.

create table if not exists post_hides (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, post_id)
);

alter table post_hides enable row level security;

drop policy if exists "Users manage their own hidden posts" on post_hides;
create policy "Users manage their own hidden posts"
  on post_hides for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
