-- Pitchorium — contenu visuel pour peupler le fil d'actualité et enrichir les projets fictifs.
-- Optionnel. A exécuter APRÈS seed_demo_projects.sql (les projets doivent déjà exister).
-- Utilise des images/vidéo de démonstration publiques (picsum.photos, pravatar.cc, exemple
-- Google/Blender Foundation) — pas de vraies photos des entreprises fictives, uniquement du
-- contenu visuel générique pour donner du corps à l'aperçu.
--
-- Limite technique : tous ces posts sont publiés par le même compte "entrepreneur" (celui
-- utilisé pour les 6 projets de démonstration), faute de pouvoir créer de nouveaux comptes
-- réels sans accès à votre messagerie pour la confirmation d'email. Si vous voulez que chaque
-- société ait sa propre identité/avatar distincts dans le fil, il faudra créer 5-6 comptes
-- "entrepreneur" vous-même (2 minutes chacun) et me dire lesquels correspondent à quelle
-- société — je réassignerai alors projets et posts.

-- Photo de profil pour le compte entrepreneur utilisé par les projets de démonstration
update profiles
set avatar_url = 'https://i.pravatar.cc/300?img=47'
where id = (select id from profiles where role = 'entrepreneur' order by created_at asc limit 1)
  and avatar_url is null;

-- Photos de couverture + galerie pour chaque projet de démonstration
update projects set
  cover_image_url = 'https://picsum.photos/seed/waxco-cover/800/500',
  gallery_urls = array[
    'https://picsum.photos/seed/waxco-1/800/500',
    'https://picsum.photos/seed/waxco-2/800/500'
  ]
where title = 'Wax & Co — Coopérative textile éthique';

update projects set
  cover_image_url = 'https://picsum.photos/seed/alphalire-cover/800/500',
  gallery_urls = array[
    'https://picsum.photos/seed/alphalire-1/800/500',
    'https://picsum.photos/seed/alphalire-2/800/500'
  ]
where title = 'AlphaLire — Alphabétisation numérique rurale';

update projects set
  cover_image_url = 'https://picsum.photos/seed/cacaoplus-cover/800/500',
  gallery_urls = array[
    'https://picsum.photos/seed/cacaoplus-1/800/500',
    'https://picsum.photos/seed/cacaoplus-2/800/500'
  ]
where title = 'CacaoPlus — Transformation locale du cacao';

update projects set
  cover_image_url = 'https://picsum.photos/seed/femcred-cover/800/500',
  gallery_urls = array[
    'https://picsum.photos/seed/femcred-1/800/500',
    'https://picsum.photos/seed/femcred-2/800/500'
  ]
where title = 'FemCred — Micro-crédit solidaire pour entrepreneures';

update projects set
  cover_image_url = 'https://picsum.photos/seed/kivumoto-cover/800/500',
  gallery_urls = array[
    'https://picsum.photos/seed/kivumoto-1/800/500',
    'https://picsum.photos/seed/kivumoto-2/800/500'
  ]
where title = 'KivuMoto — Mobilité électrique urbaine';

update projects set
  cover_image_url = 'https://picsum.photos/seed/karukera-cover/800/500',
  gallery_urls = array[
    'https://picsum.photos/seed/karukera-1/800/500',
    'https://picsum.photos/seed/karukera-2/800/500'
  ]
where title = 'Karukera Bio — Maraîchage biologique en circuit court';

-- Publications dans le fil : succès, difficultés, espoirs de chaque société — reliées à leur
-- projet respectif via project_id.
insert into posts (author_id, project_id, body, image_url, created_at)
select
  (select id from profiles where role = 'entrepreneur' order by created_at asc limit 1),
  p.id,
  v.body,
  v.image_url,
  now() - (v.days_ago || ' days')::interval
from (values
  ('Wax & Co — Coopérative textile éthique',
   '🎉 Grande nouvelle : notre boutique en ligne vient de dépasser les 500 commandes ! Merci à toutes les personnes qui soutiennent le travail de nos 18 couturières depuis le début.',
   'https://picsum.photos/seed/waxco-post1/800/500', 2),
  ('Wax & Co — Coopérative textile éthique',
   'Ce mois-ci n''a pas été simple : une machine à coudre est tombée en panne en pleine production. On a dû réorganiser les équipes en urgence, mais la coopérative a tenu bon 💪.',
   'https://picsum.photos/seed/waxco-post2/800/500', 9),
  ('Wax & Co — Coopérative textile éthique',
   'Notre espoir pour 2026 : ouvrir un second atelier et former 10 nouvelles couturières issues du quartier. On y croit !',
   'https://picsum.photos/seed/waxco-post3/800/500', 16),
  ('AlphaLire — Alphabétisation numérique rurale',
   '📚 450 apprenants touchés en phase pilote ! Le taux de complétion des modules dépasse nos objectifs (68%). Une immense fierté pour toute l''équipe.',
   'https://picsum.photos/seed/alphalire-post1/800/500', 3),
  ('AlphaLire — Alphabétisation numérique rurale',
   'On a rencontré un vrai défi technique : dans certains villages, même les tablettes basiques peinent à tenir la charge une semaine entière. On travaille sur une solution solaire.',
   'https://picsum.photos/seed/alphalire-post2/800/500', 11),
  ('CacaoPlus — Transformation locale du cacao',
   '120 producteurs partenaires payés 25% au-dessus du cours mondial ce trimestre. C''est exactement la promesse qu''on avait faite en lançant CacaoPlus.',
   'https://picsum.photos/seed/cacaoplus-post1/800/500', 4),
  ('CacaoPlus — Transformation locale du cacao',
   'Revers ce mois-ci : notre demande de certification export UE a été refusée une première fois pour un dossier incomplet. On corrige et on redépose dans 3 semaines.',
   'https://picsum.photos/seed/cacaoplus-post2/800/500', 13),
  ('FemCred — Micro-crédit solidaire pour entrepreneures',
   '34 groupes solidaires financés, 96% de taux de remboursement 🙌. La preuve que la confiance entre femmes entrepreneures, ça marche.',
   'https://picsum.photos/seed/femcred-post1/800/500', 1),
  ('FemCred — Micro-crédit solidaire pour entrepreneures',
   'Notre espoir : atteindre 100 groupes solidaires financés d''ici la fin de l''année, et ouvrir le programme à une seconde région.',
   'https://picsum.photos/seed/femcred-post2/800/500', 20),
  ('Karukera Bio — Maraîchage biologique en circuit court',
   'Objectif de financement atteint à 100% 🎉 Merci à tous nos contributeurs ! Les deux cantines scolaires sont maintenant approvisionnées chaque semaine.',
   'https://picsum.photos/seed/karukera-post1/800/500', 5)
) as v(project_title, body, image_url, days_ago)
join projects p on p.title = v.project_title;

-- Un post avec vidéo pour KivuMoto (vidéo de démonstration publique, pas une vraie vidéo de
-- l'entreprise fictive)
insert into posts (author_id, project_id, body, video_url, created_at)
select
  (select id from profiles where role = 'entrepreneur' order by created_at asc limit 1),
  p.id,
  '🎥 Premier tour de piste de nos motos électriques dans les rues de Kigali ! 15 motos déjà en circulation, les conducteurs adorent le silence et les économies de carburant.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  now() - interval '7 days'
from projects p
where p.title = 'KivuMoto — Mobilité électrique urbaine';
