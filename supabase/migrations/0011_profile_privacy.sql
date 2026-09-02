-- Pitchorium — migration 0011 : confidentialité de profil (liste d'abonnés visible ou non,
-- informations détaillées publiques ou non). A exécuter APRÈS 0001 à 0010. Additive.

alter table profiles add column if not exists followers_visible boolean not null default true;
alter table profiles add column if not exists details_private boolean not null default false;
