-- Pitchorium — migration 0010 : personnalisation des stories (texte + couleur) et réactions
-- multiples sur les publications (façon Facebook/Instagram, une réaction par personne).
-- A exécuter dans l'éditeur SQL Supabase, APRÈS 0001 à 0009. Additive.

alter table stories add column if not exists caption text;
alter table stories add column if not exists caption_color text;

alter table post_likes add column if not exists reaction text not null default 'like';
