# WTF Check-in

Application de check-in événementiel. Projet standalone, indépendant de toute autre application.

## Stack

- **React 19 + Vite + TypeScript** — front-end
- **Tailwind CSS v4** — style
- **Supabase** (PostgreSQL + Realtime + Storage) — backend
- **Vercel** — déploiement

## Fonctionnalités

- **Accueil** (`/`) : liste des événements, création d'un nouvel événement
- **Configuration d'événement** (`/events/:id`) : nom, logo (upload Supabase Storage, fallback par défaut), import CSV (`prénom;nom;statut;taille`), ajout manuel, tableau des participants
- **Pointage** (`/events/:id/pointage`) : recherche par nom (3 caractères min, insensible accents/casse), badges statut/taille, bascule présence, ajout d'un invité +1, synchronisé en temps réel (Supabase Realtime) entre plusieurs animateurs

## Prérequis

- Node.js 20+
- Un compte [Supabase](https://supabase.com) (gratuit) pour créer un projet
- Un compte [Vercel](https://vercel.com) pour le déploiement (optionnel en local)

## Démarrage en local

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Créer un projet sur [supabase.com](https://supabase.com/dashboard), puis récupérer son **Project URL** et sa clé **anon/public** (Project Settings → API).

   Appliquer ensuite le schéma : ouvrir **SQL Editor** dans le dashboard Supabase, coller le contenu de `supabase/migrations/0001_init.sql` et l'exécuter. Cela crée les tables `events`/`participants`, le bucket de stockage `event-logos` (public) et active le Realtime sur `participants`.

   > MVP sans authentification : les policies RLS autorisent un accès complet à la clé anon. À restreindre quand l'auth sera ajoutée.

3. Copier le fichier d'exemple d'environnement et renseigner les valeurs Supabase :

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```

4. Lancer le serveur de développement :

   ```bash
   npm run dev
   ```

   L'application est accessible sur http://localhost:5173.

## Scripts disponibles

| Commande          | Description                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Lance le serveur de développement Vite    |
| `npm run build`   | Vérifie les types puis build de prod      |
| `npm run preview` | Prévisualise le build de prod en local    |
| `npm run lint`    | Lint le code avec Oxlint                  |

## Structure du projet

```
src/
├── components/   # Composants React réutilisables
├── pages/        # Pages / écrans de l'application
├── hooks/        # Hooks React custom
├── lib/          # Clients et utilitaires (ex: supabase.ts)
├── types/        # Types TypeScript partagés
├── App.tsx        # Composant racine
└── main.tsx       # Point d'entrée
```

## Supabase

Le client Supabase est initialisé dans `src/lib/supabase.ts` à partir des variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Le schéma (tables, policies RLS, bucket de stockage, Realtime) est défini dans `supabase/migrations/0001_init.sql` — voir l'étape 2 ci-dessus pour l'appliquer.

## Déploiement sur Vercel

1. Pousser le projet sur un dépôt Git (GitHub, GitLab, Bitbucket).
2. Importer le dépôt dans [Vercel](https://vercel.com/new). Le framework Vite est détecté automatiquement.
3. Renseigner les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les paramètres du projet Vercel (Project Settings → Environment Variables).
4. Déployer. Le fichier `vercel.json` gère déjà les rewrites nécessaires au routage côté client (SPA).

## Prochaine étape

Hors périmètre V1 (voir cahier des charges) : authentification, QR code / badges, lead capture exposants, dashboard de reporting, matchmaking.
