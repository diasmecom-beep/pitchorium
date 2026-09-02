-- Pitchorium — projets fictifs de démonstration.
-- Optionnel : à exécuter dans l'éditeur SQL Supabase pour visualiser l'application avec du
-- contenu varié (Vitrine, Fil, recherche, filtres). N'affecte aucune structure de table.
-- Ces 6 projets sont rattachés au premier profil "entrepreneur" existant sur votre projet
-- (peu importe lequel — c'est uniquement pour peupler l'app visuellement).
-- Suppression : une requête de nettoyage est fournie tout en bas du fichier.

-- 1. Wax & Co — Coopérative textile éthique (Côte d'Ivoire)
with new_project as (
  insert into projects (
    owner_id, title, summary, description, sector, impact_area, country,
    funding_goal, amount_raised, status, duration_days, deadline, platform_fee_percent,
    funding_instruments_accepted, impact_scores, impact_score, impact_notes
  )
  select
    (select id from profiles where role = 'entrepreneur' order by created_at asc limit 1),
    'Wax & Co — Coopérative textile éthique',
    'Une coopérative de couturières à Abidjan qui transforme le tissu wax en pièces de mode responsables.',
    'Wax & Co regroupe 18 couturières formées aux techniques durables : chutes de tissu valorisées, teintures végétales, ateliers ouverts aux jeunes du quartier. La coopérative vend en ligne et via des boutiques partenaires en Europe.',
    'Couture & Mode', 'Égalité femmes-hommes', 'Côte d''Ivoire',
    15000, 9200, 'published', 60, now() + interval '45 days', 5,
    array['Don', 'Crowdfunding', 'Prêt d''honneur'],
    '{"environnement":2,"durabilite_economique":2,"autonomisation":3,"parite":3,"jeunesse":2,"utilite_publique":1,"inclusion_sociale":2,"emplois_locaux":3,"transfert_competences":2,"gouvernance":2,"synergie_diaspora":2,"bien_etre":2}'::jsonb,
    72,
    '18 couturières employées, 30% de la production en tissus recyclés.'
  returning id
), tiers as (
  insert into campaign_tiers (project_id, amount, title, description, sort_order)
  select id, 1000, 'Palier atelier', 'Financement du premier lot de machines à coudre.', 1 from new_project
  union all
  select id, 8000, 'Palier boutique en ligne', 'Lancement de la boutique en ligne et packaging.', 2 from new_project
  returning project_id
)
insert into campaign_rewards (project_id, min_amount, title, description, applicable_instruments)
select project_id, 50, 'Merci', 'Une carte de remerciement personnalisée.', array['Don', 'Crowdfunding'] from tiers limit 1;

-- 2. AlphaLire — Alphabétisation numérique rurale (Sénégal)
with new_project as (
  insert into projects (
    owner_id, title, summary, description, sector, impact_area, country,
    funding_goal, amount_raised, status, duration_days, deadline, platform_fee_percent,
    funding_instruments_accepted, impact_scores, impact_score, impact_notes
  )
  select
    (select id from profiles where role = 'entrepreneur' order by created_at asc limit 1),
    'AlphaLire — Alphabétisation numérique rurale',
    'Une application hors-ligne pour apprendre à lire en wolof et en français dans les villages sans réseau.',
    'AlphaLire fonctionne sur des tablettes low-cost partagées entre plusieurs foyers, avec un contenu conçu par des enseignants sénégalais. Le programme cible en priorité les femmes et les jeunes déscolarisés.',
    'EdTech', 'Éducation', 'Sénégal',
    8000, 3100, 'published', 45, now() + interval '30 days', 5,
    array['Don', 'Subvention', 'Crowdfunding'],
    '{"environnement":1,"durabilite_economique":2,"autonomisation":2,"parite":2,"jeunesse":3,"utilite_publique":3,"inclusion_sociale":3,"emplois_locaux":1,"transfert_competences":3,"gouvernance":2,"synergie_diaspora":3,"bien_etre":3}'::jsonb,
    78,
    '450 apprenants touchés en phase pilote, taux de complétion de 68%.'
  returning id
)
insert into campaign_tiers (project_id, amount, title, description, sort_order)
select id, 2000, 'Palier tablettes', '20 tablettes supplémentaires pour 3 nouveaux villages.', 1 from new_project
union all
select id, 6000, 'Palier contenu', 'Production de modules avancés (calcul, santé).', 2 from new_project;

-- 3. CacaoPlus — Transformation locale du cacao (Ghana)
with new_project as (
  insert into projects (
    owner_id, title, summary, description, sector, impact_area, country,
    funding_goal, amount_raised, status, duration_days, deadline, platform_fee_percent,
    funding_instruments_accepted, impact_scores, impact_score, impact_notes
  )
  select
    (select id from profiles where role = 'entrepreneur' order by created_at asc limit 1),
    'CacaoPlus — Transformation locale du cacao',
    'Une unité de transformation qui permet aux producteurs ghanéens de vendre du chocolat fini plutôt que des fèves brutes.',
    'CacaoPlus achète directement à 120 petits producteurs à un prix supérieur au marché, transforme le cacao localement et exporte des tablettes finies vers l''Europe, captant une marge qui restait auparavant à l''étranger.',
    'Agroalimentaire & Transformation', 'Développement rural', 'Ghana',
    25000, 18700, 'published', 75, now() + interval '20 days', 5,
    array['Prise de participation (equity)', 'Obligations convertibles', 'Crowdfunding'],
    '{"environnement":2,"durabilite_economique":2,"autonomisation":2,"parite":1,"jeunesse":1,"utilite_publique":1,"inclusion_sociale":2,"emplois_locaux":3,"transfert_competences":2,"gouvernance":2,"synergie_diaspora":1,"bien_etre":1}'::jsonb,
    56,
    '120 producteurs partenaires, prix d''achat 25% au-dessus du cours mondial.'
  returning id
)
insert into campaign_tiers (project_id, amount, title, description, sort_order)
select id, 10000, 'Palier ligne de production', 'Achat d''une seconde chaîne de conditionnement.', 1 from new_project
union all
select id, 20000, 'Palier export', 'Certification export UE et entrepôt à Tema.', 2 from new_project;

-- 4. FemCred — Micro-crédit solidaire pour entrepreneures (Cameroun)
with new_project as (
  insert into projects (
    owner_id, title, summary, description, sector, impact_area, country,
    funding_goal, amount_raised, status, duration_days, deadline, platform_fee_percent,
    funding_instruments_accepted, impact_scores, impact_score, impact_notes
  )
  select
    (select id from profiles where role = 'entrepreneur' order by created_at asc limit 1),
    'FemCred — Micro-crédit solidaire pour entrepreneures',
    'Une plateforme de micro-crédit entre pairs dédiée aux entrepreneures camerounaises exclues du système bancaire classique.',
    'FemCred met en relation des groupes de caution solidaire de 5 femmes avec des prêts de 100 à 800€, remboursés en 6 à 12 mois. Un accompagnement en gestion est inclus pour chaque groupe.',
    'FinTech', 'Inclusion financière', 'Cameroun',
    12000, 4500, 'published', 60, now() + interval '50 days', 5,
    array['Don', 'Subvention', 'Prêt d''honneur'],
    '{"environnement":1,"durabilite_economique":3,"autonomisation":3,"parite":3,"jeunesse":2,"utilite_publique":2,"inclusion_sociale":3,"emplois_locaux":2,"transfert_competences":3,"gouvernance":3,"synergie_diaspora":2,"bien_etre":3}'::jsonb,
    83,
    '34 groupes solidaires financés, taux de remboursement de 96%.'
  returning id
)
insert into campaign_rewards (project_id, min_amount, title, description, applicable_instruments)
select id, 100, 'Marraine/Parrain', 'Suivi trimestriel de l''impact de votre don sur un groupe.', array['Don'] from new_project;

-- 5. KivuMoto — Mobilité électrique urbaine (Rwanda)
with new_project as (
  insert into projects (
    owner_id, title, summary, description, sector, impact_area, country,
    funding_goal, amount_raised, status, duration_days, deadline, platform_fee_percent,
    funding_instruments_accepted, impact_scores, impact_score, impact_notes
  )
  select
    (select id from profiles where role = 'entrepreneur' order by created_at asc limit 1),
    'KivuMoto — Mobilité électrique urbaine',
    'Une flotte de motos-taxis électriques et un réseau de stations d''échange de batteries à Kigali.',
    'KivuMoto remplace les motos-taxis thermiques par des modèles électriques loués aux conducteurs, avec des batteries échangeables en 90 secondes dans un réseau de stations solaires.',
    'Mobilité & Logistique', 'Climat & environnement', 'Rwanda',
    40000, 11000, 'published', 90, now() + interval '75 days', 5,
    array['Prise de participation (equity)', 'Obligations convertibles'],
    '{"environnement":3,"durabilite_economique":1,"autonomisation":1,"parite":1,"jeunesse":1,"utilite_publique":2,"inclusion_sociale":1,"emplois_locaux":2,"transfert_competences":1,"gouvernance":2,"synergie_diaspora":1,"bien_etre":2}'::jsonb,
    50,
    '15 motos en circulation, 4 tonnes de CO2 évitées estimées sur 6 mois.'
  returning id
)
insert into campaign_tiers (project_id, amount, title, description, sort_order)
select id, 15000, 'Palier flotte', '25 motos électriques supplémentaires.', 1 from new_project
union all
select id, 35000, 'Palier stations', '3 stations d''échange de batteries solaires.', 2 from new_project;

-- 6. Karukera Bio — Maraîchage biologique en circuit court (Guadeloupe) — déjà financé
with new_project as (
  insert into projects (
    owner_id, title, summary, description, sector, impact_area, country,
    funding_goal, amount_raised, status, duration_days, deadline, platform_fee_percent,
    funding_instruments_accepted, impact_scores, impact_score, impact_notes
  )
  select
    (select id from profiles where role = 'entrepreneur' order by created_at asc limit 1),
    'Karukera Bio — Maraîchage biologique en circuit court',
    'Une exploitation maraîchère bio en Guadeloupe qui approvisionne les marchés locaux et les cantines scolaires.',
    'Karukera Bio cultive sur 3 hectares sans intrants chimiques et livre en circuit court : marchés de producteurs, cantines scolaires, paniers hebdomadaires. Le projet a atteint son objectif de financement.',
    'AgriTech', 'Développement rural', 'Guadeloupe',
    6000, 6000, 'funded', 30, now() - interval '5 days', 5,
    array['Don', 'Crowdfunding'],
    '{"environnement":3,"durabilite_economique":2,"autonomisation":2,"parite":1,"jeunesse":1,"utilite_publique":1,"inclusion_sociale":2,"emplois_locaux":2,"transfert_competences":2,"gouvernance":2,"synergie_diaspora":3,"bien_etre":2}'::jsonb,
    64,
    '3 hectares en agriculture biologique certifiée, 2 cantines scolaires approvisionnées.'
  returning id
)
insert into campaign_rewards (project_id, min_amount, title, description, applicable_instruments)
select id, 30, 'Panier découverte', 'Un panier de légumes de saison livré une fois.', array['Don', 'Crowdfunding'] from new_project;

-- Pour supprimer ces 6 projets de démonstration plus tard (et leurs paliers/contreparties liés
-- par cascade), décommentez et exécutez :
-- delete from projects where title in (
--   'Wax & Co — Coopérative textile éthique',
--   'AlphaLire — Alphabétisation numérique rurale',
--   'CacaoPlus — Transformation locale du cacao',
--   'FemCred — Micro-crédit solidaire pour entrepreneures',
--   'KivuMoto — Mobilité électrique urbaine',
--   'Karukera Bio — Maraîchage biologique en circuit court'
-- );
