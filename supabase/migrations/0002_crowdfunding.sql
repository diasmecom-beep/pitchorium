-- Pitchorium — migration 0002 : financement participatif (paliers, contreparties, contributions, médias)
-- A exécuter dans l'éditeur SQL de votre projet Supabase, APRÈS 0001 (schema.sql).
-- Additive : ne supprime aucune donnée existante (profils, projets déjà créés sont conservés).

-- 1. Champs de campagne sur les projets existants
alter table projects add column if not exists video_url text;
alter table projects add column if not exists gallery_urls text[] not null default '{}';
alter table projects add column if not exists duration_days int not null default 60;
alter table projects add column if not exists deadline timestamptz;
alter table projects add column if not exists platform_fee_percent numeric(5, 2) not null default 5;
alter table projects add column if not exists funding_instruments_accepted text[] not null default '{}';

-- 2. Paliers de financement (chaque palier débloque des fonds/actions indépendamment des autres)
create table if not exists campaign_tiers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  amount numeric(12, 2) not null,
  title text not null,
  description text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 3. Contreparties, ciblées par type de financement (ex: réservées aux instruments "equity", ou absentes pour le love money)
create table if not exists campaign_rewards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  min_amount numeric(12, 2) not null,
  title text not null,
  description text not null,
  applicable_instruments text[] not null default '{}', -- vide = s'applique à tous les instruments acceptés
  quantity_available int,
  quantity_claimed int not null default 0,
  estimated_delivery text,
  created_at timestamptz not null default now()
);

-- 4. Contributions (pledges). Le paiement lui-même n'est pas traité par cette base :
--    le statut reste "pending" tant qu'aucun prestataire de paiement réel n'est branché.
create table if not exists pledges (
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

-- 5. Actualités de campagne (permet à l'entrepreneur de tenir ses contributeurs informés,
--    notamment les contributeurs "love money" à qui un retour d'expérience est promis)
create table if not exists campaign_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table campaign_tiers enable row level security;
alter table campaign_rewards enable row level security;
alter table pledges enable row level security;
alter table campaign_updates enable row level security;

-- Tiers : lecture publique si le projet est publié (ou par son propriétaire), écriture par le propriétaire
drop policy if exists "Tiers are publicly readable" on campaign_tiers;
create policy "Tiers are publicly readable"
  on campaign_tiers for select using (
    exists (select 1 from projects p where p.id = project_id and (p.status = 'published' or p.owner_id = auth.uid()))
  );

drop policy if exists "Owners manage their tiers" on campaign_tiers;
create policy "Owners manage their tiers"
  on campaign_tiers for all using (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Rewards : même logique que les tiers
drop policy if exists "Rewards are publicly readable" on campaign_rewards;
create policy "Rewards are publicly readable"
  on campaign_rewards for select using (
    exists (select 1 from projects p where p.id = project_id and (p.status = 'published' or p.owner_id = auth.uid()))
  );

drop policy if exists "Owners manage their rewards" on campaign_rewards;
create policy "Owners manage their rewards"
  on campaign_rewards for all using (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Pledges : le contributeur voit ses propres contributions, le porteur de projet voit celles reçues sur son projet
drop policy if exists "Backers view their own pledges" on pledges;
create policy "Backers view their own pledges"
  on pledges for select using (
    backer_id = auth.uid()
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

drop policy if exists "Backers create pledges" on pledges;
create policy "Backers create pledges"
  on pledges for insert with check (backer_id = auth.uid());

drop policy if exists "Owners update pledges on their projects" on pledges;
create policy "Owners update pledges on their projects"
  on pledges for update using (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- Updates : lecture publique si projet publié, écriture par le propriétaire
drop policy if exists "Updates are publicly readable" on campaign_updates;
create policy "Updates are publicly readable"
  on campaign_updates for select using (
    exists (select 1 from projects p where p.id = project_id and (p.status = 'published' or p.owner_id = auth.uid()))
  );

drop policy if exists "Owners post updates" on campaign_updates;
create policy "Owners post updates"
  on campaign_updates for insert with check (
    exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

-- 6. Stockage des photos de galerie (bucket public en lecture, écriture par utilisateur authentifié
--    dans son propre dossier "{user_id}/...")
insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read project media" on storage.objects;
create policy "Public read project media"
  on storage.objects for select
  using (bucket_id = 'project-media');

drop policy if exists "Authenticated users upload project media" on storage.objects;
create policy "Authenticated users upload project media"
  on storage.objects for insert
  with check (bucket_id = 'project-media' and auth.uid() is not null);

drop policy if exists "Owners delete their project media" on storage.objects;
create policy "Owners delete their project media"
  on storage.objects for delete
  using (bucket_id = 'project-media' and auth.uid()::text = (storage.foldername(name))[1]);
