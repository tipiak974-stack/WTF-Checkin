# WTF Check-in

Application de check-in événementiel. Projet standalone, indépendant de toute autre application.

## Stack

- **React 19 + Vite + TypeScript** — front-end
- **Tailwind CSS v4** — style
- **Supabase** (PostgreSQL + Realtime + Storage) — backend
- **Vercel** — déploiement

> Ce scaffold ne contient pas encore de fonctionnalités métier (pas de logique de check-in, pas de schéma de base de données). Il pose seulement la structure du projet.

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

Le client Supabase est initialisé dans `src/lib/supabase.ts` à partir des variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Le schéma de base de données, les tables, les policies RLS et la logique Realtime seront ajoutés dans une prochaine étape.

## Déploiement sur Vercel

1. Pousser le projet sur un dépôt Git (GitHub, GitLab, Bitbucket).
2. Importer le dépôt dans [Vercel](https://vercel.com/new). Le framework Vite est détecté automatiquement.
3. Renseigner les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les paramètres du projet Vercel (Project Settings → Environment Variables).
4. Déployer. Le fichier `vercel.json` gère déjà les rewrites nécessaires au routage côté client (SPA).

## Prochaine étape

Ce scaffold sera complété par les fonctionnalités métier (formulaire de check-in, tableau de bord événement, synchronisation en temps réel via Supabase Realtime, gestion des uploads via Supabase Storage, etc.) dans un second prompt.
