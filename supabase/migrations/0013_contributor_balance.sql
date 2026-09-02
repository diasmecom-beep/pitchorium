-- Pitchorium — migration 0013 : réserve pré-provisionnée pour les contributeurs.
-- IMPORTANT : ceci n'est PAS un portefeuille électronique réel — Pitchorium ne détient ni ne
-- déplace de fonds réels. C'est un solde auto-déclaré que chaque contributeur alimente et gère
-- lui-même (comme un budget personnel), qui sert uniquement à préremplir/accélérer ses
-- contributions dans l'appli sans ressaisir un moyen de paiement à chaque fois.
-- A exécuter APRÈS 0001 à 0012. Additive.

alter table profiles add column if not exists available_balance numeric(12, 2) not null default 0;

create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  amount numeric(12, 2) not null,
  type text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table wallet_transactions enable row level security;

drop policy if exists "Users manage their own wallet transactions" on wallet_transactions;
create policy "Users manage their own wallet transactions"
  on wallet_transactions for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
