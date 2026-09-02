-- Pitchorium — migration 0005 : préférence de notifications email + suivi des contributions
-- de temps (mentorat, expertise...) pour le "Portefeuille d'impact" du contributeur.
-- A exécuter dans l'éditeur SQL de votre projet Supabase, APRÈS 0001 à 0004.
-- Additive : ne supprime aucune donnée existante.

alter table profiles add column if not exists email_notifications_enabled boolean not null default true;

create table if not exists time_contributions (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references profiles (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  hours numeric(6, 2) not null,
  description text,
  created_at timestamptz not null default now()
);

alter table time_contributions enable row level security;

drop policy if exists "Contributors manage their own time log" on time_contributions;
create policy "Contributors manage their own time log"
  on time_contributions for all using (contributor_id = auth.uid())
  with check (contributor_id = auth.uid());
