-- Pitchorium — migration 0007 : fil d'actualité (posts, likes, commentaires, partages),
-- système d'abonnement (follow), et type d'organisation pour les contributeurs (ONG, etc.).
-- A exécuter dans l'éditeur SQL de votre projet Supabase, APRÈS 0001 à 0006.
-- Additive : ne supprime aucune donnée existante.

alter table profiles add column if not exists organization_type text;

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, followee_id)
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  body text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

alter table follows enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;
alter table post_shares enable row level security;

drop policy if exists "Follows are publicly readable" on follows;
create policy "Follows are publicly readable" on follows for select using (true);

drop policy if exists "Users manage their own follows" on follows;
create policy "Users manage their own follows"
  on follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

drop policy if exists "Posts are publicly readable" on posts;
create policy "Posts are publicly readable" on posts for select using (true);

drop policy if exists "Authors manage their own posts" on posts;
create policy "Authors manage their own posts"
  on posts for all using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "Likes are publicly readable" on post_likes;
create policy "Likes are publicly readable" on post_likes for select using (true);

drop policy if exists "Users manage their own likes" on post_likes;
create policy "Users manage their own likes"
  on post_likes for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "Comments are publicly readable" on post_comments;
create policy "Comments are publicly readable" on post_comments for select using (true);

drop policy if exists "Users create their own comments" on post_comments;
create policy "Users create their own comments"
  on post_comments for insert with check (author_id = auth.uid());

drop policy if exists "Authors delete their own comments" on post_comments;
create policy "Authors delete their own comments"
  on post_comments for delete using (author_id = auth.uid());

drop policy if exists "Shares are publicly readable" on post_shares;
create policy "Shares are publicly readable" on post_shares for select using (true);

drop policy if exists "Users manage their own shares" on post_shares;
create policy "Users manage their own shares"
  on post_shares for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
