-- Pitchorium — migration 0004 : critères d'impact / durabilité sur les profils et les projets.
-- A exécuter dans l'éditeur SQL de votre projet Supabase, APRÈS 0001, 0002 et 0003.
-- Additive : ne supprime aucune donnée existante.

alter table profiles add column if not exists impact_scores jsonb not null default '{}';
alter table profiles add column if not exists impact_score numeric(5, 2) not null default 0;
alter table profiles add column if not exists impact_notes text;

alter table projects add column if not exists impact_scores jsonb not null default '{}';
alter table projects add column if not exists impact_score numeric(5, 2) not null default 0;
alter table projects add column if not exists impact_notes text;
