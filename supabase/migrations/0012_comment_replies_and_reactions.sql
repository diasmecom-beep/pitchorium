-- Pitchorium — migration 0012 : réponses aux commentaires + réactions colorées sur les
-- commentaires (même système que sur les publications). A exécuter APRÈS 0001 à 0011. Additive.

alter table post_comments add column if not exists parent_comment_id uuid references post_comments (id) on delete cascade;

create table if not exists comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references post_comments (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  reaction text not null default 'like',
  created_at timestamptz not null default now(),
  unique (comment_id, profile_id)
);

alter table comment_reactions enable row level security;

drop policy if exists "Comment reactions are publicly readable" on comment_reactions;
create policy "Comment reactions are publicly readable" on comment_reactions for select using (true);

drop policy if exists "Users manage their own comment reactions" on comment_reactions;
create policy "Users manage their own comment reactions"
  on comment_reactions for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
