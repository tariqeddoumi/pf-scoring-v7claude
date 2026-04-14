# Stratégie de Préfixe Paramétrable des Tables

## Objectif

Permettre le déploiement du même codebase avec des conventions de noms de tables différentes.

**Exemples:**
- Déploiement 1: `BP_PF_users`, `BP_PF_projects`, `BP_PF_v7pp_evaluations`
- Déploiement 2: `PF_SCORE_users`, `PF_SCORE_projects`, `PF_SCORE_v7pp_evaluations`
- Déploiement 3: `CUSTOM_PREFIX_users`, etc.

---

## Architecture

```
schema.template.prisma      ← Template avec placeholders __TABLE_PREFIX__
    ↓
node scripts/create-template.js    ← Génère template à partir du schéma courant
    ↓
.env (TABLE_PREFIX=PF_SCORE)        ← Variable d'environnement
    ↓
node scripts/generate-schema.js     ← Génère schema.prisma avec le prefix
    ↓
prisma/schema.prisma        ← Schéma final avec bon prefix
    ↓
prisma migrate                       ← Déploiement en BD
```

---

## Workflow: Ajouter un Nouveau Déploiement

### 1️⃣ Définir le PREFIX dans `.env`

```bash
# .env
TABLE_PREFIX=PF_SCORE
DATABASE_URL=postgresql://user:pass@host/db_pf_score
```

### 2️⃣ Générer le schéma

```bash
TABLE_PREFIX=PF_SCORE npm run schema:generate
```

Cela crée/met à jour `prisma/schema.prisma` avec:
- `@@map("PF_SCORE_users")`
- `@@map("PF_SCORE_projects")`
- etc.

### 3️⃣ Appliquer les migrations

```bash
npm run db:migrate
```

ou

```bash
npx prisma migrate deploy  # En production
```

---

## Fichiers Clés

### `schema.template.prisma`

Le template source contenant les placeholders:

```prisma
model User {
  id    String  @id @default(uuid())
  email String  @unique

  @@map("__TABLE_PREFIX___users")
}

model Project {
  id   String  @id @default(uuid())
  nom  String

  @@map("__TABLE_PREFIX___projects")
}
```

### `scripts/create-template.js`

Crée le template à partir du schéma courant:

```bash
node scripts/create-template.js
```

**Remplace:** `@@map("BP_PF_users")` → `@@map("__TABLE_PREFIX___users")`

### `scripts/generate-schema.js`

Génère le schéma final à partir du template:

```bash
TABLE_PREFIX=PF_SCORE npm run schema:generate
```

**Remplace:** `@@map("__TABLE_PREFIX___users")` → `@@map("PF_SCORE_users")`

---

## Cas d'Usage

### Déploiement Production avec Nouveau Prefix

**Contexte:** Tu as `BP_PF_*` en dev, tu veux déployer en prod avec `PF_PROD_*`

**Étapes:**

```bash
# 1. Configurer le prefix
export TABLE_PREFIX=PF_PROD

# 2. Générer le schéma
npm run schema:generate

# 3. Vérifier les tables
grep "@@map" prisma/schema.prisma | head -5
# Sortie: @@map("PF_PROD_users"), @@map("PF_PROD_projects"), ...

# 4. Déployer
npx prisma migrate deploy
```

### Multi-Client / Multi-Tenant

Si tu dois héberger plusieurs clients:

```bash
# Client A
TABLE_PREFIX=CLIENT_A npm run schema:generate
npm run db:migrate

# Client B
TABLE_PREFIX=CLIENT_B npm run schema:generate
npm run db:migrate
```

Chaque client aura ses propres tables avec son prefix.

---

## Limitations & Notes

### ✅ Ce qui fonctionne

- [x] Préfixes statiques par déploiement
- [x] Multi-client via repos déployés séparément
- [x] Migrations par prefix
- [x] Cohérence avec Prisma

### ⚠️ Limitations

- Prisma n'autorise pas les prefixes **dynamiques à runtime** (variables d'env dans @@map)
- Tu dois régénérer le schéma à chaque changement de prefix
- Les migrations doivent être appliquées **pour chaque préfixe** séparément

### 🔧 Optimisation Future

Si tu veux du vrai multi-tenant dynamique, il faudrait:
- Ajouter une couche d'abstraction dessus
- Utiliser des vues ou des schémas PostgreSQL
- Implémenter le dynamic schema switching en code

---

## Commandes Rapides

```bash
# Créer/mettre à jour le template
npm run schema:template

# Générer pour déploiement spécifique
TABLE_PREFIX=MY_PREFIX npm run schema:generate

# Vérifier les tables générées
grep "@@map" prisma/schema.prisma

# Valider le schéma
npx prisma format

# Migrer en production
npx prisma migrate deploy
```

---

## Erreurs Courantes

### ❌ "@@map directive not found"

→ Le template n'existe pas. Lance `npm run schema:template`

### ❌ "Placeholder not replaced"

→ Le prefix n'a pas été substitué. Vérifie:
```bash
echo $TABLE_PREFIX
npm run schema:generate
```

### ❌ "Foreign key constraint failed"

→ Tables de différents prefixes. Assure-toi d'utiliser **le même prefix** pour tout le déploiement.

---

## Prochaines Étapes

1. **Tester localement:**
   ```bash
   TABLE_PREFIX=TEST npm run schema:generate
   npx prisma db push
   ```

2. **Ajouter à CI/CD:** Générer le schéma avec le bon prefix avant le build

3. **Documenter en équipe:** Rappeler le flux à chaque déploiement

