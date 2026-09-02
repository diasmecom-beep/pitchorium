-- Pitchorium — migration 0015 : galeries multi-photos/vidéos sur les publications et les
-- stories, et notification lorsqu'un profil est consulté.
-- A exécuter APRÈS 0001 à 0014. Additive.

alter table posts add column if not exists media_urls text[] not null default '{}';
alter table stories add column if not exists media_urls text[] not null default '{}';

-- Notifie le propriétaire d'un profil lorsque quelqu'un d'autre le consulte.
create or replace function notify_profile_view()
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

drop trigger if exists on_profile_view_created on profile_views;
create trigger on_profile_view_created after insert on profile_views for each row execute procedure notify_profile_view();
