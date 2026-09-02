# Pitchorium

## Concept

Pitchorium est une application qui met en relation les entrepreneurs du continent africain avec les afrodescendants du continent européen.

## Objectifs

- Créer des synergies et des collaborations entre entrepreneurs africains et afrodescendants d'Europe
- Mettre en place une vitrine de projets à impact
- Permettre aux mécènes, investisseurs et autres partenaires financiers de découvrir et d'investir dans ces projets

## Stack technique

- Application unique en React Native + Expo (TypeScript), compatible mobile (iOS/Android) et web (via react-native-web)
- Navigation par fichiers avec Expo Router
- Backend : [Supabase](https://supabase.com) (authentification + base de données Postgres + Row Level Security)

## Fonctionnalités

- Inscription / connexion avec choix du rôle : **Entrepreneur** ou **Investisseur / Mécène**
- Profils adaptés selon le rôle (parcours entrepreneur vs thèses d'investissement)
- Vitrine des projets à impact publiés (`app/(tabs)/index.tsx`)
- Fiche projet détaillée avec suivi de financement (`app/project/[id].tsx`)
- Création de projet par un entrepreneur, en brouillon ou publié (`app/project/new.tsx`)
- Manifestation d'intérêt d'un investisseur/mécène sur un projet

## Configuration du backend (Supabase)

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Dans l'éditeur SQL du projet, exécutez le contenu de [`supabase/schema.sql`](./supabase/schema.sql) (tables `profiles`, `projects`, `project_interests`, policies RLS incluses)
3. Copiez `.env.example` vers `.env` et renseignez `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API dans Supabase)

## Démarrer le projet

```bash
npm install
npm run web       # lance la version web
npm run ios       # lance la version iOS (simulateur)
npm run android   # lance la version Android (émulateur)
```

Sans configuration Supabase, l'interface se lance mais l'authentification et les données ne fonctionneront pas.

## Statut

Architecture de base en place : navigation, écrans (profils, vitrine de projets, détail projet), schéma de base de données et policies RLS. Reste à connecter un vrai projet Supabase, ajouter l'upload d'images (logo/cover des projets) et affiner le design.
