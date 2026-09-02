-- Pitchorium — migration 0016 : partager une publication l'ajoute réellement dans le fil de la
-- personne qui partage (comme un "repost"), visible par ses propres abonnés.
-- A exécuter APRÈS 0001 à 0015. Additive.

alter table posts add column if not exists shared_post_id uuid references posts (id) on delete cascade;
