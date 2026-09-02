-- Pitchorium — migration 0008 : support d'une vidéo optionnelle sur les publications du fil.
-- A exécuter dans l'éditeur SQL de votre projet Supabase, APRÈS 0001 à 0007. Additive.

alter table posts add column if not exists video_url text;
