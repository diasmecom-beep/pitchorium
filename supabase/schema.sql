-- Pitchorium — schema Supabase complet (Postgres)
--
-- Ce fichier reflète l'état final de la base pour une INSTALLATION NEUVE.
-- Si votre projet Supabase existe déjà et contient des données, N'EXÉCUTEZ PAS ce fichier :
-- utilisez plutôt les scripts dans supabase/migrations/ dans l'ordre (0001, puis 0002, ...).
--
-- ATTENTION : ce script supprime les tables existantes avant de les recréer.

drop table if exists campaign_updates cascade;
drop table if exists pledges cascade;
drop table if exists campaign_rewards cascade;
drop table if exists campaign_tiers cascade;
drop table if exists project_interests cascade;
drop table if exists projects cascade;
drop table if exists profiles cascade;
drop function if exists handle_new_user cascade;
drop type if exists project_status cascade;
drop type if exists user_role cascade;

create type user_role as enum ('entrepreneur', 'contributeur');
create type project_status as enum ('draft', 'published', 'funded', 'closed');

-- Profils, liés 1:1 à auth.users
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  onboarding_completed boolean not null default false,

  -- Commun aux deux rôles
  full_name text not null,
  headline text,
  bio text,
  country text,
  city text,
  avatar_url text,
  website text,
  organization text,
  organization_type text,

  -- Entrepreneur : profil d'entreprise
  company_name text,
  sector text,
  stage text,
  founding_year int,
  team_size text,
  pitch_short text,

  -- Entrepreneur : ce qu'il recherche sur la plateforme
  needs text[] not null default '{}',
  expertise_needed text[] not null default '{}',
  funding_amount_sought numeric(12, 2),
  funding_types_sought text[] not null default '{}',

  -- Contributeur : rôle(s) choisis et zone d'intervention
  contribution_types text[] not null default '{}',
  sectors_of_interest text[] not null default '{}',
  intervention_countries text[] not null default '{}',
  expertise_domains text[] not null default '{}',

  -- Contributeur : investisseur
  investment_ticket_min numeric(12, 2),
  investment_ticket_max numeric(12, 2),
  investment_stages text[] not null default '{}',
  investment_instruments text[] not null default '{}',

  -- Contributeur : mécène
  mecenat_types text[] not null default '{}',

  -- Contributeur : mentor / expert
  mentor_availability text,
  mentor_format text,
  expert_mission_types text[] not null default '{}',

  -- Critères d'impact / durabilité (auto-déclaratif)
  impact_scores jsonb not null default '{}',
  impact_score numeric(5, 2) not null default 0,
  impact_notes text,

  -- Préférences
  email_notifications_enabled boolean not null default true,
  followers_visible boolean not null default true,
  details_private boolean not null default false,
  -- Réserve pré-provisionnée auto-déclarée (pas un portefeuille électronique réel — voir
  -- migration 0013 pour le détail de cette limite volontaire)
  available_balance numeric(12, 2) not null default 0,

  created_at timestamptz not null default now()
);

-- Projets à impact / campagnes de financement portés par des entrepreneurs
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  summary text not null,
  description text not null,
  sector text not null,
  impact_area text not null,
  country text not null,
  funding_goal numeric(12, 2) not null default 0,
  amount_raised numeric(12, 2) not null default 0,
  status project_status not null default 'draft',
  cover_image_url text,

  -- Campagne de financement
  video_url text,
  gallery_urls text[] not null default '{}',
  duration_days int not null default 60,
  deadline timestamptz,
  platform_fee_percent numeric(5, 2) not null default 5,
  funding_instruments_accepted text[] not null default '{}',

  -- Critères d'impact / durabilité (auto-déclaratif)
  impact_scores jsonb not null default '{}',
  impact_score numeric(5, 2) not null default 0,
  impact_notes text,

  created_at timestamptz not null default now()
);

-- Marques d'intérêt des contributeurs sur un projet (contact non engageant)
create table project_interests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  investor_id uuid not null references profiles (id) on delete cascade,
  message text,
  created_at timestamptz not null default now(),
  unique (project_id, investor_id)
);

-- Paliers de financement : chaque palier débloque des fonds/actions indépendamment des autres
create table campaign_tiers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  amount numeric(12, 2) not null,
  title text not null,
  description text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Contreparties, ciblées par type de financement (ex: réservées à l'equity, absentes pour le love money)
create table campaign_rewards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  min_amount numeric(12, 2) not null,
  title text not null,
  description text not null,
  applicable_instruments text[] not null default '{}',
  quantity_available int,
  quantity_claimed int not null default 0,
  estimated_delivery text,
  created_at timestamptz not null default now()
);

-- Contributions (pledges). Le paiement lui-même n'est pas traité par cette base :
-- le statut reste "pending" tant qu'aucun prestataire de paiement réel n'est branché.
create table pledges (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  backer_id uuid not null references profiles (id) on delete cascade,
  amount numeric(12, 2) not null,
  funding_instrument text not null,
  reward_id uuid references campaign_rewards (id) on delete set null,
  payment_method text not null,
  status text not null default 'pending',
  commitment_accepted boolean not null default false,
  created_at timestamptz not null default now()
);

-- Actualités de campagne (permet de tenir les contributeurs informés, notamment les
-- contributeurs "love money" à qui un retour d'expérience est promis)
create table campaign_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Contributions de temps (mentorat, expertise...) déclarées par les contributeurs,
-- utilisées pour leur "Portefeuille d'impact"
create table time_contributions (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references profiles (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  hours numeric(6, 2) not null,
  description text,
  created_at timestamptz not null default now()
);

-- Historique de la réserve pré-provisionnée (pas un vrai portefeuille — voir profiles.available_balance)
create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  amount numeric(12, 2) not null,
  type text not null,
  note text,
  created_at timestamptz not null default now()
);

-- Messagerie interne : conversations 1:1 + messages
create table conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one_id uuid not null references profiles (id) on delete cascade,
  participant_two_id uuid not null references profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (participant_one_id, participant_two_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create function touch_conversation_last_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_created
  after insert on messages
  for each row execute procedure touch_conversation_last_message();

-- Système d'abonnement : un profil suit un autre profil pour voir ses publications
create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, followee_id)
);

-- Fil d'actualité façon réseau social : publications, likes, commentaires, partages
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  body text not null,
  image_url text,
  video_url text,
  tagged_profile_id uuid references profiles (id) on delete set null,
  filter_color text,
  media_urls text[] not null default '{}',
  shared_post_id uuid references posts (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  reaction text not null default 'heart',
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  parent_comment_id uuid references post_comments (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references post_comments (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  reaction text not null default 'heart',
  created_at timestamptz not null default now(),
  unique (comment_id, profile_id)
);

create table post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

-- Stories éphémères façon Instagram (filtrage des 24h côté application)
create table stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  image_url text not null,
  caption text,
  caption_color text,
  tagged_profile_id uuid references profiles (id) on delete set null,
  filter_color text,
  media_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Publications enregistrées (privé, comme sur Instagram)
create table post_saves (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

-- Masquer une publication de son propre fil (privé, par profil)
create table post_hides (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, post_id)
);

-- Qui a consulté mon profil
create table profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references profiles (id) on delete cascade,
  viewed_profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Historique des abonnements/désabonnements (pour les statistiques d'abonnés gagnés/perdus)
create table follow_events (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  event text not null,
  created_at timestamptz not null default now()
);

-- Notifications (nouvel abonné, réaction, commentaire, partage, nouvelle publication suivie, tag)
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles (id) on delete cascade,
  actor_id uuid references profiles (id) on delete set null,
  type text not null,
  post_id uuid references posts (id) on delete cascade,
  comment_id uuid references post_comments (id) on delete cascade,
  message text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Déclencheurs : centralisent la création des notifications et du journal d'abonnements côté
-- base de données, pour que ce soit fiable quel que soit l'écran utilisé côté app.

create function log_follow_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into follow_events (follower_id, followee_id, event) values (new.follower_id, new.followee_id, 'follow');
    insert into notifications (recipient_id, actor_id, type) values (new.followee_id, new.follower_id, 'follow');
    return new;
  elsif TG_OP = 'DELETE' then
    insert into follow_events (follower_id, followee_id, event) values (old.follower_id, old.followee_id, 'unfollow');
    return old;
  end if;
  return null;
end;
$$;

create trigger on_follow_change
  after insert or delete on follows
  for each row execute procedure log_follow_event();

create function notify_followers_new_post()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into notifications (recipient_id, actor_id, type, post_id)
  select follower_id, new.author_id, 'new_post', new.id
  from follows where followee_id = new.author_id;

  if new.tagged_profile_id is not null and new.tagged_profile_id != new.author_id then
    insert into notifications (recipient_id, actor_id, type, post_id)
    values (new.tagged_profile_id, new.author_id, 'tag', new.id);
  end if;
  return new;
end;
$$;

create trigger on_post_created after insert on posts for each row execute procedure notify_followers_new_post();

create function notify_story_tag()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.tagged_profile_id is not null and new.tagged_profile_id != new.author_id then
    insert into notifications (recipient_id, actor_id, type, message)
    values (new.tagged_profile_id, new.author_id, 'tag', 'story');
  end if;
  return new;
end;
$$;

create trigger on_story_created after insert on stories for each row execute procedure notify_story_tag();

create function notify_post_reaction()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from posts where id = new.post_id;
  if post_author is not null and post_author != new.profile_id then
    insert into notifications (recipient_id, actor_id, type, post_id) values (post_author, new.profile_id, 'like', new.post_id);
  end if;
  return new;
end;
$$;

create trigger on_post_like_created after insert on post_likes for each row execute procedure notify_post_reaction();

create function notify_post_share()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from posts where id = new.post_id;
  if post_author is not null and post_author != new.profile_id then
    insert into notifications (recipient_id, actor_id, type, post_id) values (post_author, new.profile_id, 'share', new.post_id);
  end if;
  return new;
end;
$$;

create trigger on_post_share_created after insert on post_shares for each row execute procedure notify_post_share();

create function notify_post_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_author uuid;
  parent_author uuid;
begin
  select author_id into post_author from posts where id = new.post_id;
  if post_author is not null and post_author != new.author_id then
    insert into notifications (recipient_id, actor_id, type, post_id, comment_id)
    values (post_author, new.author_id, 'comment', new.post_id, new.id);
  end if;
  if new.parent_comment_id is not null then
    select author_id into parent_author from post_comments where id = new.parent_comment_id;
    if parent_author is not null and parent_author != new.author_id and parent_author != post_author then
      insert into notifications (recipient_id, actor_id, type, post_id, comment_id)
      values (parent_author, new.author_id, 'reply', new.post_id, new.id);
    end if;
  end if;
  return new;
end;
$$;

create trigger on_comment_created after insert on post_comments for each row execute procedure notify_post_comment();

-- Notifie le propriétaire d'un profil lorsque quelqu'un d'autre le consulte.
create function notify_profile_view()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.viewer_id != new.viewed_profile_id then
    insert into notifications (recipient_id, actor_id, type)
    values (new.viewed_profile_id, new.viewer_id, 'profile_view');
  end if;
  return new;
end;
$$;

create trigger on_profile_view_created after insert on profile_views for each row execute procedure notify_profile_view();

-- Création automatique du profil à l'inscription (role/full_name passés en metadata lors du signUp)
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'entrepreneur'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_interests enable row level security;
alter table campaign_tiers enable row level security;
alter table campaign_rewards enable row level security;
alter table pledges enable row level security;
alter table campaign_updates enable row level security;
alter table time_contributions enable row level security;
alter table wallet_transactions enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table follows enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;
alter table post_shares enable row level security;
alter table stories enable row level security;
alter table post_saves enable row level security;
alter table post_hides enable row level security;
alter table comment_reactions enable row level security;
alter table profile_views enable row level security;
alter table follow_events enable row level security;
alter table notifications enable row level security;

-- Profiles : lecture publique, écriture par le propriétaire uniquement
create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Projects : lecture publique des projets publiés, gestion par le propriétaire
create policy "Published projects are publicly readable"
  on projects for select using (status = 'published' or owner_id = auth.uid());

create policy "Entrepreneurs can create their own projects"
  on projects for insert with check (owner_id = auth.uid());

create policy "Owners can update their own projects"
  on projects for update using (owner_id = auth.uid());

create policy "Owners can delete their own projects"
  on projects for delete using (owner_id = auth.uid());

-- Project interests : visibles par le contributeur qui les a créées et le propriétaire du projet
create policy "Investors can view their own interests"
  on project_interests for select using (
    investor_id = auth.uid()
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "Investors can express interest"
  on project_interests for insert with check (investor_id = auth.uid());

-- Tiers : lecture publique si le projet est publié (ou par son propriétaire), écriture par le propriétaire
create policy "Tiers are publicly readable"
  on campaign_tiers for select using (
    exists (select 1 from projects p where p.id = project_id and (p.status = 'published' or p.owner_id = auth.uid()))
  );

create policy "Owners manage their tiers"
  on campaign_tiers for all using (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Rewards : même logique que les tiers
create policy "Rewards are publicly readable"
  on campaign_rewards for select using (
    exists (select 1 from projects p where p.id = project_id and (p.status = 'published' or p.owner_id = auth.uid()))
  );

create policy "Owners manage their rewards"
  on campaign_rewards for all using (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Pledges : le contributeur voit ses propres contributions, le porteur de projet voit celles reçues
create policy "Backers view their own pledges"
  on pledges for select using (
    backer_id = auth.uid()
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "Backers create pledges"
  on pledges for insert with check (backer_id = auth.uid());

create policy "Owners update pledges on their projects"
  on pledges for update using (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Updates : lecture publique si projet publié, écriture par le propriétaire
create policy "Updates are publicly readable"
  on campaign_updates for select using (
    exists (select 1 from projects p where p.id = project_id and (p.status = 'published' or p.owner_id = auth.uid()))
  );

create policy "Owners post updates"
  on campaign_updates for insert with check (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Time contributions : chaque contributeur gère uniquement son propre journal
create policy "Contributors manage their own time log"
  on time_contributions for all using (contributor_id = auth.uid())
  with check (contributor_id = auth.uid());

-- Réserve pré-provisionnée : strictement privée à son propriétaire
create policy "Users manage their own wallet transactions"
  on wallet_transactions for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Messagerie : chacun voit/écrit uniquement dans ses propres conversations
create policy "Participants view their conversations"
  on conversations for select using (
    auth.uid() = participant_one_id or auth.uid() = participant_two_id
  );

create policy "Participants create conversations"
  on conversations for insert with check (
    auth.uid() = participant_one_id or auth.uid() = participant_two_id
  );

create policy "Participants view their messages"
  on messages for select using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );

create policy "Participants send messages"
  on messages for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );

create policy "Participants mark messages read"
  on messages for update using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );

-- Follows : lecture publique (pour compter abonnés/abonnements), gestion par le follower uniquement
create policy "Follows are publicly readable" on follows for select using (true);

create policy "Users manage their own follows"
  on follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- Fil d'actualité : lecture publique, écriture par l'auteur
create policy "Posts are publicly readable" on posts for select using (true);

create policy "Authors manage their own posts"
  on posts for all using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "Likes are publicly readable" on post_likes for select using (true);

create policy "Users manage their own likes"
  on post_likes for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "Comments are publicly readable" on post_comments for select using (true);

create policy "Users create their own comments"
  on post_comments for insert with check (author_id = auth.uid());

create policy "Authors delete their own comments"
  on post_comments for delete using (author_id = auth.uid());

create policy "Shares are publicly readable" on post_shares for select using (true);

create policy "Users manage their own shares"
  on post_shares for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Stories : lecture publique, écriture par l'auteur uniquement
create policy "Stories are publicly readable" on stories for select using (true);

create policy "Authors manage their own stories"
  on stories for all using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Posts enregistrés : strictement privés
create policy "Users manage their own saves"
  on post_saves for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "Users manage their own hidden posts"
  on post_hides for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Réactions sur les commentaires : lecture publique, gestion par son auteur
create policy "Comment reactions are publicly readable" on comment_reactions for select using (true);

create policy "Users manage their own comment reactions"
  on comment_reactions for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Vues de profil : uniquement visibles par le profil consulté ; enregistrées par le visiteur
create policy "Profile owners can see their views" on profile_views for select using (viewed_profile_id = auth.uid());

create policy "Viewers can log a view" on profile_views for insert with check (viewer_id = auth.uid());

-- Historique des abonnements : uniquement visible par le compte suivi
create policy "Followee can see their follow events" on follow_events for select using (followee_id = auth.uid());

-- Notifications : chacun ne voit et ne modifie que les siennes (les insertions passent par des
-- déclencheurs "security definer", pas de policy d'insertion nécessaire pour les utilisateurs)
create policy "Recipients see their own notifications" on notifications for select using (recipient_id = auth.uid());

create policy "Recipients update their own notifications" on notifications for update using (recipient_id = auth.uid());

-- Stockage des photos de galerie (bucket public en lecture, écriture par utilisateur authentifié
-- dans son propre dossier "{user_id}/...")
insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do nothing;

create policy "Public read project media"
  on storage.objects for select
  using (bucket_id = 'project-media');

create policy "Authenticated users upload project media"
  on storage.objects for insert
  with check (bucket_id = 'project-media' and auth.uid() is not null);

create policy "Owners delete their project media"
  on storage.objects for delete
  using (bucket_id = 'project-media' and auth.uid()::text = (storage.foldername(name))[1]);
