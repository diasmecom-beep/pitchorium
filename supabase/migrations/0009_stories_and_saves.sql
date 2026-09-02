-- Pitchorium — migration 0009 : stories (contenu éphémère façon Instagram) et sauvegarde
-- de publications. A exécuter dans l'éditeur SQL Supabase, APRÈS 0001 à 0008. Additive.

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists post_saves (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

alter table stories enable row level security;
alter table post_saves enable row level security;

-- Stories : lecture publique (le tri/filtrage des 24h se fait côté application), écriture par
-- l'auteur uniquement.
drop policy if exists "Stories are publicly readable" on stories;
create policy "Stories are publicly readable" on stories for select using (true);

drop policy if exists "Authors manage their own stories" on stories;
create policy "Authors manage their own stories"
  on stories for all using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Posts enregistrés : strictement privés, comme sur Instagram (personne d'autre ne voit vos
-- enregistrements).
drop policy if exists "Users manage their own saves" on post_saves;
create policy "Users manage their own saves"
  on post_saves for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
