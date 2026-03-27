# PF Scoring - Project Finance

## Description
Application de Scoring Project Finance pour une banque marocaine.
Conforme IFC, EBRD, Basel, Bank Al-Maghrib.
Interface en français. Monnaie : MAD.

## Stack technique
- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript strict
- **Style** : TailwindCSS + shadcn/ui (thème sombre)
- **ORM** : Prisma
- **Base de données** : Supabase (PostgreSQL + Auth)
- **Déploiement** : Vercel

## Commandes
- `npm run dev` — Serveur de développement
- `npm run build` — Build production
- `npm run lint` — ESLint
- `npm run type-check` — Vérification TypeScript
- `npm run format` — Prettier (écriture)
- `npm run format:check` — Prettier (vérification)

## Structure du projet
```
/app            — Pages et routes (App Router)
  /dashboard    — Tableau de bord
  /projects     — Liste des projets
  /projects/[id]— Détail projet
  /methodology  — Méthodologie de scoring
  /audit        — Journal d'audit
  /api/         — Routes API
/components
  /ui           — Composants shadcn/ui
  /scoring      — Composants de scoring
  /dashboard    — Composants tableau de bord
  /project      — Composants projet
  /layout       — Composants de mise en page
/lib
  scoring-engine.ts — Moteur de calcul des scores
  constants.ts      — Constantes (grades, catégories, seuils)
  utils.ts          — Utilitaires (cn, formatMAD, formatDate)
  supabase.ts       — Client Supabase
  validations.ts    — Schémas Zod
/prisma
  schema.prisma     — Schéma base de données
/types
  index.ts          — Types TypeScript
```

## Conventions
- Interface entièrement en français
- Monnaie : MAD (Dirham marocain)
- Grades : AAA → D (conforme Basel)
- Catégories de risque : financier, technique, marché, environnemental (IFC), social (EBRD), gouvernance, juridique, pays (Bank Al-Maghrib)
- Toujours utiliser TypeScript strict
- Composants serveur par défaut, "use client" uniquement si nécessaire
