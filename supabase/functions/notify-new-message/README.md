# Notification email pour les nouveaux messages

Cette fonction envoie un email au destinataire d'un message dès qu'il est créé dans la table
`messages`. Elle n'est pas active tant que les étapes ci-dessous ne sont pas faites — la
messagerie in-app fonctionne déjà sans elle, seul l'email est en attente de branchement.

## 1. Créer un compte Resend (service d'envoi d'email)

1. Allez sur [resend.com](https://resend.com) et créez un compte gratuit (3 000 emails/mois offerts)
2. Dans **API Keys**, créez une clé et copiez-la (commence par `re_...`)
3. Pour commencer sans configurer votre propre domaine, vous pouvez envoyer depuis
   `onboarding@resend.dev` (déjà utilisé dans `index.ts`) — mais Resend limite cet expéditeur
   test à l'adresse email de votre propre compte Resend. Pour envoyer à tous vos utilisateurs,
   il faudra vérifier votre propre domaine (**Domains** → **Add Domain**, puis ajouter les
   enregistrements DNS fournis) et changer `FROM_ADDRESS` dans `index.ts`.

## 2. Installer et connecter le CLI Supabase (une fois)

```bash
npm install -g supabase
supabase login
```

`supabase login` ouvre votre navigateur pour vous authentifier — c'est vous qui devez le faire
(je ne peux pas me connecter à votre compte à votre place).

Puis, depuis le dossier `Pitchorium` :

```bash
supabase link --project-ref VOTRE_PROJECT_REF
```

(`VOTRE_PROJECT_REF` se trouve dans l'URL de votre dashboard Supabase :
`https://supabase.com/dashboard/project/VOTRE_PROJECT_REF`)

## 3. Ajouter la clé Resend comme secret

```bash
supabase secrets set RESEND_API_KEY=re_votre_cle
```

## 4. Déployer la fonction

```bash
supabase functions deploy notify-new-message
```

## 5. Brancher le déclencheur (Database Webhook)

Dans le dashboard Supabase :

1. **Database** → **Webhooks** → **Create a new hook**
2. Nom : `notify-new-message`
3. Table : `messages`
4. Événements : cochez uniquement **Insert**
5. Type : **Supabase Edge Functions**
6. Fonction : sélectionnez `notify-new-message`
7. Enregistrez

## Test

Envoyez un message dans l'app entre deux comptes de test. Si le destinataire a
"Recevoir les actualités par email" activé dans son profil, un email devrait arriver
(vérifiez aussi le dossier spam avec le domaine `resend.dev`).

## Notes

- Si le destinataire a désactivé les notifications email dans son profil, aucun email n'est
  envoyé (la fonction s'arrête proprement).
- Cette fonction ne notifie que les nouveaux messages. Elle ne gère pas encore les emails
  groupés (ex: un seul email récapitulatif si plusieurs messages arrivent en même temps).
