-- Pitchorium — migration 0014 : notifications, statistiques (vues de profil, historique des
-- abonnements), et identification d'une personne sur un post/story.
-- A exécuter APRÈS 0001 à 0013. Additive.

-- Aligne les anciennes réactions 'like' (ancien jeu de réactions) sur la nouvelle clé 'heart'.
alter table post_likes alter column reaction set default 'heart';
alter table comment_reactions alter column reaction set default 'heart';
update post_likes set reaction = 'heart' where reaction = 'like';
update comment_reactions set reaction = 'heart' where reaction = 'like';

-- Identifier quelqu'un sur une publication ou une story, et appliquer un filtre de couleur
-- (superposition semi-transparente) façon éditeur de story Instagram.
alter table posts add column if not exists tagged_profile_id uuid references profiles (id) on delete set null;
alter table posts add column if not exists filter_color text;
alter table stories add column if not exists tagged_profile_id uuid references profiles (id) on delete set null;
alter table stories add column if not exists filter_color text;

-- Qui a consulté mon profil
create table if not exists profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references profiles (id) on delete cascade,
  viewed_profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Historique des abonnements/désabonnements (pour calculer les abonnés gagnés/perdus dans le temps)
create table if not exists follow_events (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles (id) on delete cascade,
  followee_id uuid not null references profiles (id) on delete cascade,
  event text not null,
  created_at timestamptz not null default now()
);

-- Notifications
create table if not exists notifications (
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

alter table profile_views enable row level security;
alter table follow_events enable row level security;
alter table notifications enable row level security;

drop policy if exists "Profile owners can see their views" on profile_views;
create policy "Profile owners can see their views" on profile_views for select using (viewed_profile_id = auth.uid());

drop policy if exists "Viewers can log a view" on profile_views;
create policy "Viewers can log a view" on profile_views for insert with check (viewer_id = auth.uid());

drop policy if exists "Followee can see their follow events" on follow_events;
create policy "Followee can see their follow events" on follow_events for select using (followee_id = auth.uid());

drop policy if exists "Recipients see their own notifications" on notifications;
create policy "Recipients see their own notifications" on notifications for select using (recipient_id = auth.uid());

drop policy if exists "Recipients update their own notifications" on notifications;
create policy "Recipients update their own notifications" on notifications for update using (recipient_id = auth.uid());

-- Déclencheurs : centralisent la création des notifications et du journal d'abonnements côté
-- base de données, pour que ce soit fiable quel que soit l'écran utilisé côté app.

create or replace function log_follow_event()
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

drop trigger if exists on_follow_change on follows;
create trigger on_follow_change
  after insert or delete on follows
  for each row execute procedure log_follow_event();

create or replace function notify_followers_new_post()
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

drop trigger if exists on_post_created on posts;
create trigger on_post_created after insert on posts for each row execute procedure notify_followers_new_post();

create or replace function notify_story_tag()
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

drop trigger if exists on_story_created on stories;
create trigger on_story_created after insert on stories for each row execute procedure notify_story_tag();

create or replace function notify_post_reaction()
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

drop trigger if exists on_post_like_created on post_likes;
create trigger on_post_like_created after insert on post_likes for each row execute procedure notify_post_reaction();

create or replace function notify_post_share()
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

drop trigger if exists on_post_share_created on post_shares;
create trigger on_post_share_created after insert on post_shares for each row execute procedure notify_post_share();

create or replace function notify_post_comment()
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

drop trigger if exists on_comment_created on post_comments;
create trigger on_comment_created after insert on post_comments for each row execute procedure notify_post_comment();
