# Database Schema Synchronization Scripts

Ce dossier contient des scripts SQL pour synchroniser et vérifier la conformité de votre base de données avec le schéma Prisma.

## 📋 Scripts Disponibles

### 1. **sync_database_schema.sql**
Script principal pour synchroniser la base de données avec le schéma Prisma.

**Ce qu'il fait:**
- ✅ Crée toutes les tables manquantes
- ✅ Ajoute les colonnes manquantes
- ✅ Crée les contraintes de clés étrangères
- ✅ Crée les indices pour les performances
- ✅ Génère un rapport de vérification

**Comment l'utiliser:**
```bash
# Via psql
psql -U postgres -d pf_scoring_db -f sql/sync_database_schema.sql

# Via Prisma (recommandé)
npx prisma db push

# Via docker (si vous utilisez Docker)
docker exec -i <container_name> psql -U postgres -d pf_scoring_db -f sql/sync_database_schema.sql
```

### 2. **verify_schema_integrity.sql**
Script de vérification complète de l'intégrité du schéma.

**Ce qu'il vérifie:**
- ✅ Existence de toutes les tables
- ✅ Présence de toutes les colonnes requises
- ✅ Type de données correct
- ✅ Contraintes uniques et clés étrangères
- ✅ Indices de base de données
- ✅ Intégrité des données (orphaned records)
- ✅ Conformité des types de données

**Comment l'utiliser:**
```bash
# Via psql
psql -U postgres -d pf_scoring_db -f sql/verify_schema_integrity.sql

# Générer un rapport dans un fichier
psql -U postgres -d pf_scoring_db -f sql/verify_schema_integrity.sql > schema_report.txt
```

### 3. **test_data_seed.sql**
Script d'injection de données de test pour valider le schéma.

**Ce qu'il insère:**
- 4 utilisateurs (admin, manager, analyst, viewer)
- 3 clients
- 3 projets
- 3 évaluations

**Attention:** ⚠️ À utiliser **UNIQUEMENT** en développement/test!

**Comment l'utiliser:**
```bash
# Via psql
psql -U postgres -d pf_scoring_db -f sql/test_data_seed.sql

# Après avoir exécuté Prisma
npx prisma db push
psql -U postgres -d pf_scoring_db -f sql/test_data_seed.sql
```

## 🔄 Workflow Recommandé

### Première initialisation:
```bash
# 1. Initialiser Prisma
npx prisma migrate dev --name init

# 2. Synchroniser le schéma
psql -U postgres -d pf_scoring_db -f sql/sync_database_schema.sql

# 3. Vérifier l'intégrité
psql -U postgres -d pf_scoring_db -f sql/verify_schema_integrity.sql

# 4. Injecter les données de test (optionnel)
psql -U postgres -d pf_scoring_db -f sql/test_data_seed.sql

# 5. Démarrer le serveur
npm run dev
```

### Après des modifications du schéma Prisma:
```bash
# 1. Créer une nouvelle migration
npx prisma migrate dev --name <description>

# 2. Synchroniser (s'il y a des changements manuels)
psql -U postgres -d pf_scoring_db -f sql/sync_database_schema.sql

# 3. Vérifier l'intégrité
psql -U postgres -d pf_scoring_db -f sql/verify_schema_integrity.sql

# 4. Redémarrer le serveur
npm run dev
```

## 📊 Tables Vérifiées

| Table | Colonnes | Relations | Status |
|-------|----------|-----------|--------|
| **BP_PF_users** | 11 | Projects, Evaluations | ✅ |
| **BP_PF_clients** | 10 | Projects | ✅ |
| **BP_PF_projects** | 13 | Clients, Users, Evaluations | ✅ |
| **BP_PF_v7pp_evaluations** | 14 | Projects, Users | ✅ |

## 🔐 Sécurité

### Constraints vérifiés:
- ✅ UNIQUE constraints sur emails
- ✅ FOREIGN KEYs avec CASCADE/SET NULL
- ✅ NOT NULL constraints sur champs critiques
- ✅ DEFAULT values pour les statuts

## 📈 Performances

### Indices créés:
```sql
-- BP_PF_users
- email (UNIQUE)

-- BP_PF_clients
- email (UNIQUE)
- status

-- BP_PF_projects
- creePar (FK)
- clientId (FK)
- status

-- BP_PF_v7pp_evaluations
- projectId (FK)
- analystId (FK)
- status
- rating
- createdAt
```

## ❌ Dépannage

### Si les tables existent déjà:
Les scripts utilisent `IF NOT EXISTS`, donc ils sont sûrs à réexécuter.

### Si vous avez des erreurs de contrainte:
```sql
-- Vérifier les contraintes orphelines
SELECT * FROM "BP_PF_projects" WHERE "creePar" NOT IN (SELECT id FROM "BP_PF_users");
SELECT * FROM "BP_PF_v7pp_evaluations" WHERE "projectId" NOT IN (SELECT id FROM "BP_PF_projects");
```

### Si vous avez des indices manquants:
Réexécutez simplement `sync_database_schema.sql` - il ajoutera les indices manquants.

## 🚀 Exemple Complet

```bash
# 1. Clone et dépendances
git clone <repo>
cd pf-scoring-v7claude
npm install

# 2. Configuration .env.local
cp .env.example .env.local
# Éditez DATABASE_URL, DIRECT_URL, etc.

# 3. Synchronisation BD
npx prisma db push
psql -U postgres -d pf_scoring_db -f sql/sync_database_schema.sql

# 4. Vérification
psql -U postgres -d pf_scoring_db -f sql/verify_schema_integrity.sql

# 5. Données de test
psql -U postgres -d pf_scoring_db -f sql/test_data_seed.sql

# 6. Démarrage
npm run dev
```

Accédez à: `http://localhost:3000`

## 📝 Notes

- Tous les IDs utilisent le type `TEXT` (UUIDs)
- Tous les timestamps sont en `TIMESTAMP(3)`
- Les enums sont stockés sous forme de `TEXT`
- Les données JSON complexes utilisent le type `JSONB`

## ✅ Conformité Vérifiée

- ✅ Base de données conforme au schéma Prisma
- ✅ Tous les champs requis sont présents
- ✅ Tous les indices sont créés
- ✅ Toutes les contraintes sont en place
- ✅ Validations cohérentes backend/frontend
- ✅ Relations correctement établies

## 📞 Support

Pour toute question ou problème, consultez:
- `/prisma/schema.prisma` - Schéma complet
- `/lib/validation-schemas.ts` - Validations
- `/lib/types/models.ts` - Types TypeScript
