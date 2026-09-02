-- Pitchorium — schema Supabase (Postgres)
-- A exécuter dans l'éditeur SQL de votre projet Supabase.
--
-- ATTENTION : ce script supprime les tables existantes avant de les recréer.
-- Ne le relancez que si vous n'avez pas encore de données réelles à conserver
-- (les comptes de test créés précédemment seront perdus).

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

  created_at timestamptz not null default now()
);

-- Projets à impact portés par des entrepreneurs
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
  created_at timestamptz not null default now()
);

-- Marques d'intérêt des contributeurs sur un projet
create table project_interests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  investor_id uuid not null references profiles (id) on delete cascade,
  message text,
  created_at timestamptz not null default now(),
  unique (project_id, investor_id)
);

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

-- Project interests : visibles par l'investisseur qui les a créées et le propriétaire du projet
create policy "Investors can view their own interests"
  on project_interests for select using (
    investor_id = auth.uid()
    or exists (select 1 from projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "Investors can express interest"
  on project_interests for insert with check (investor_id = auth.uid());
