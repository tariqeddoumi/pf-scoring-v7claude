# 🚀 GUIDE DÉPLOIEMENT SUPABASE + VERCEL

## ÉTAPE 1: Supabase (5 min)

1. https://supabase.com → Sign up
2. Create new project (Région: eu-west-1)
3. Copier credentials (Project URL, Anon Key, Service Key)

## ÉTAPE 2: Database (3 min)

1. Supabase → SQL Editor → New query
2. Copier contenu `database/schema.sql`
3. Exécuter → ✅ 13 tables créées

## ÉTAPE 3: .env.local (5 min)

```bash
cp .env.example .env.local
# Remplir: URL, ANON_KEY, SERVICE_KEY
```

## ÉTAPE 4: Test Local (2 min)

```bash
npm run dev
# Test: http://localhost:3000/api/evaluations
```

## ÉTAPE 5: Vercel Deploy (5 min)

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel deploy --prod
```

## ✅ DONE!

App live à: https://your-domain.vercel.app
