# Guide de Déploiement Vercel

## Étapes pour le déploiement

### 1. Créer un compte / Connecter Vercel
- Allez sur https://vercel.com
- Connectez votre compte GitHub
- Importez le repo `tariqeddoumi/pf-scoring-v7claude`

### 2. Configurer les variables d'environnement
Dans les Vercel Project Settings, ajouter:

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Remplacer:**
- `[PROJECT-REF]` par votre référence Supabase
- `password` par votre mot de passe Supabase
- `your-anon-key-here` par votre clé anon Supabase

### 3. Connecter Supabase
```bash
# 1. Initialiser Supabase dans le projet
npx supabase init

# 2. Appliquer les migrations
npx supabase migration up

# 3. Générer les types TypeScript
npx supabase gen types --lang typescript > types/database.types.ts
```

### 4. Build et test local
```bash
npm run build
npm run start
```

### 5. Déployer sur Vercel
- Vercel appliquera automatiquement les migrations lors du déploiement
- L'application sera accessible à: `https://pf-scoring-v7claude.vercel.app`

## Post-déploiement

### Migrations de schéma
Les migrations Prisma seront appliquées automatiquement pendant le build Vercel grâce aux hooks `postinstall`.

### Vérifier le statut
```bash
# Voir les logs de déploiement
vercel logs

# Voir les fonctions serverless
vercel ls
```

## Architecture de déploiement

```
┌─────────────────────────────────────┐
│      Vercel (Next.js Hosting)       │
│  ┌─────────────────────────────────┐│
│  │   Edge Network & CDN             ││
│  │   - Images optimisées            ││
│  │   - CSS/JS minifiés              ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │   API Routes (Serverless)        ││
│  │   - /api/projects                ││
│  │   - /api/projects/[id]/scoring   ││
│  │   - /api/audit                   ││
│  └─────────────────────────────────┘│
└──────────────────┬──────────────────┘
                   │ HTTPS
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────────┐    ┌──────▼───────┐
    │  Supabase  │    │   Database   │
    │  Auth      │    │  (PostgreSQL)│
    │            │    │              │
    └────────────┘    └──────────────┘
```

## Variables d'environnement de production

Supabase fournira les URLs de connexion optimisées pour Vercel:
- `DATABASE_URL`: Pool de connexions (pgBouncer) pour les connexions rapides
- `DIRECT_URL`: Connexion directe pour les migrations Prisma

## Notes importantes

1. **Migrations automatiques**: Les migrations seront appliquées lors du build
2. **Sécurité**: Les clés Supabase ne sont jamais exposées publiquement
3. **Monitoring**: Utiliser Vercel Analytics pour surveiller les performances
4. **Logs**: Les logs sont accessibles via `vercel logs` ou le dashboard Vercel

## Troubleshooting

### Erreur: "unable to resolve migrations"
- Vérifier que `.env.local` est présent avec les bonnes variables
- S'assurer que Prisma est installé: `npm install -D prisma`

### Erreur: "Database connection failed"
- Vérifier que DATABASE_URL et DIRECT_URL sont corrects
- Vérifier que le projet Supabase est actif

### Build échoue
```bash
# Nettoyer et rebuilder
rm -rf .next node_modules
npm install
npm run build
```
