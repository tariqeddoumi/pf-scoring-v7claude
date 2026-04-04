# 📦 Déploiement PF Scoring V7++

## Phase 6: Backend & Production

### ✅ Étape 1: Configuration Supabase

```bash
# 1. Créer un compte Supabase (supabase.com)
# 2. Créer un nouveau projet
# 3. Copier les credentials:
#    - Project URL → NEXT_PUBLIC_SUPABASE_URL
#    - Anon Key → NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - Service Role Key → SUPABASE_SERVICE_ROLE_KEY

# 4. Créer .env.local
cp .env.example .env.local
# Remplir les variables
```

### ✅ Étape 2: Initialiser la Base de Données

```bash
# Dans Supabase SQL Editor:
# Copier le contenu de database/schema.sql
# Exécuter le script complet
```

### ✅ Étape 3: Configuration Prisma (Optionnel)

```bash
npm install -D @prisma/cli
npx prisma init
npx prisma db push
```

### ✅ Étape 4: Tester API Localement

```bash
npm run dev
# Accéder à http://localhost:3000/api/evaluations
```

### ✅ Étape 5: Déployer sur Vercel

```bash
# Lier le repo
vercel link

# Ajouter env variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Déployer
vercel deploy --prod
```

### 🔑 Variables Critiques

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxx...
SUPABASE_SERVICE_ROLE_KEY=eyxx...
```

### ✓ Checklist Pré-Production

- [ ] Supabase project créé et configuré
- [ ] Schema SQL exécuté dans Supabase
- [ ] Env variables définies localement
- [ ] API routes testées localement
- [ ] Auth Supabase fonctionnelle
- [ ] RLS policies appliquées
- [ ] Vercel project créé
- [ ] Env variables ajoutées à Vercel
- [ ] Déploiement réussi

### 📊 Status Actuel

✅ API Routes créées
✅ Supabase client configuré  
✅ RBAC middleware prêt
✅ Config management
✅ TypeScript types
🔄 Auth & RLS (à terminer)
