-- Pitchorium — migration 0006 : messagerie interne (conversations 1:1 + messages).
-- A exécuter dans l'éditeur SQL de votre projet Supabase, APRÈS 0001 à 0005.
-- Additive : ne supprime aucune donnée existante.

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  participant_one_id uuid not null references profiles (id) on delete cascade,
  participant_two_id uuid not null references profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (participant_one_id, participant_two_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- Met à jour la date du dernier message sur la conversation, pour trier la liste de messagerie.
create or replace function touch_conversation_last_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on messages;
create trigger on_message_created
  after insert on messages
  for each row execute procedure touch_conversation_last_message();

alter table conversations enable row level security;
alter table messages enable row level security;

drop policy if exists "Participants view their conversations" on conversations;
create policy "Participants view their conversations"
  on conversations for select using (
    auth.uid() = participant_one_id or auth.uid() = participant_two_id
  );

drop policy if exists "Participants create conversations" on conversations;
create policy "Participants create conversations"
  on conversations for insert with check (
    auth.uid() = participant_one_id or auth.uid() = participant_two_id
  );

drop policy if exists "Participants view their messages" on messages;
create policy "Participants view their messages"
  on messages for select using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );

drop policy if exists "Participants send messages" on messages;
create policy "Participants send messages"
  on messages for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );

drop policy if exists "Participants mark messages read" on messages;
create policy "Participants mark messages read"
  on messages for update using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (auth.uid() = c.participant_one_id or auth.uid() = c.participant_two_id)
    )
  );
