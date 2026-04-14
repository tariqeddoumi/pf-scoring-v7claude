# Multi-Deployment Architecture

## Overview

The PF Scoring V7++ application supports **parameterizable table prefixes** enabling deployment to multiple environments, clients, or instances with different table naming conventions without code changes.

This document covers deployment strategies, configuration, and troubleshooting.

---

## Deployment Models

### Model 1: Single Client, Multiple Environments

```
Production:  DATABASE_URL=postgresql://prod/pf_db
             TABLE_PREFIX=PROD

Staging:     DATABASE_URL=postgresql://staging/pf_db
             TABLE_PREFIX=STAGING

Development: DATABASE_URL=postgresql://dev/pf_db
             TABLE_PREFIX=DEV
```

**Tables Created:**
- `PROD_users`, `PROD_projects`, `PROD_evaluations`
- `STAGING_users`, `STAGING_projects`, `STAGING_evaluations`
- `DEV_users`, `DEV_projects`, `DEV_evaluations`

### Model 2: Multi-Tenant (Per-Client Deployment)

```
Bank A (Morocco):        TABLE_PREFIX=BAM_SCORE
Bank B (Egypt):          TABLE_PREFIX=NBE_SCORE
Bank C (Tunisia):        TABLE_PREFIX=BT_SCORE
```

Each bank:
- Separate Git branch
- Separate Vercel project
- Separate Supabase project
- Separate `.env` with unique TABLE_PREFIX

### Model 3: Containerized (CI/CD)

```bash
# Docker build with dynamic prefix
docker build --build-arg TABLE_PREFIX=CUSTOM_v1 .

# Container launches with generated schema
npm run schema:generate && npm run db:migrate
```

---

## Architecture

### File Structure

```
prisma/
├─ schema.template.prisma    ← Template with __TABLE_PREFIX__ placeholders
├─ schema.prisma             ← Generated (Git ignored)
└─ migrations/
   └─ [timestamp]_*.sql      ← Contain __TABLE_PREFIX__ placeholders

scripts/
├─ create-template.js        ← Generates template from current schema
└─ generate-schema.js        ← Generates final schema from template

.env                         ← TABLE_PREFIX and DATABASE_URL
.gitignore                   ← Ignores schema.prisma
```

### Workflow

```
┌──────────────────────────────────────────┐
│  Develop with concrete prefix             │
│  (e.g., BP_PF_users in schema.prisma)    │
└────────────────┬─────────────────────────┘
                 ▼
┌──────────────────────────────────────────┐
│  npm run schema:template                  │
│  Creates prisma/schema.template.prisma   │
│  Replaces BP_PF_* with __TABLE_PREFIX__  │
└────────────────┬─────────────────────────┘
                 ▼
┌──────────────────────────────────────────┐
│  Commit template.prisma to Git            │
│  (schema.prisma is .gitignored)          │
└────────────────┬─────────────────────────┘
                 ▼
┌──────────────────────────────────────────┐
│  On deployment:                          │
│  TABLE_PREFIX=PROD npm run schema:generate│
│  Generates schema.prisma with PROD_*    │
└────────────────┬─────────────────────────┘
                 ▼
┌──────────────────────────────────────────┐
│  npx prisma migrate deploy                │
│  Applies migrations with PROD_* tables   │
└──────────────────────────────────────────┘
```

---

## Setup

### Initial Setup

#### Step 1: Ensure Template Exists

```bash
npm run schema:template
```

This reads your current `prisma/schema.prisma` and creates `schema.template.prisma` with placeholders.

**What it does:**
```typescript
// Before (schema.prisma):
model User {
  @@map("BP_PF_users")
}

// After (schema.template.prisma):
model User {
  @@map("__TABLE_PREFIX___users")
}
```

**Check the result:**
```bash
cat prisma/schema.template.prisma | grep @@map | head -5
```

Output:
```
@@map("__TABLE_PREFIX___users")
@@map("__TABLE_PREFIX___projects")
@@map("__TABLE_PREFIX___evaluations")
```

#### Step 2: Commit Template

```bash
git add prisma/schema.template.prisma
git commit -m "chore: Update schema template with new tables"
```

The generated `schema.prisma` is **NOT committed** (see `.gitignore`).

### Per-Deployment Setup

#### Environment Configuration

Create or update `.env` for your deployment:

```bash
# .env (Development)
TABLE_PREFIX=DEV
DATABASE_URL=postgresql://user:pass@localhost:5432/pf_dev

# .env.production (Production)
TABLE_PREFIX=PROD
DATABASE_URL=postgresql://user:pass@prod-server:5432/pf_prod

# .env.staging (Staging)
TABLE_PREFIX=STAGING
DATABASE_URL=postgresql://user:pass@staging-server:5432/pf_staging
```

#### Generate Schema

```bash
# For development
TABLE_PREFIX=DEV npm run schema:generate

# For production
TABLE_PREFIX=PROD npm run schema:generate

# Verify
grep "@@map" prisma/schema.prisma | head -3
```

Expected output:
```
@@map("PROD_users")
@@map("PROD_projects")
@@map("PROD_evaluations")
```

#### Apply Migrations

```bash
# Create new database and apply migrations
npx prisma db push

# Or in production
npx prisma migrate deploy
```

---

## Commands Reference

### Development Workflow

```bash
# 1. Update schema.prisma with new table/field
# (Use concrete prefix during development)

# 2. Create migration
npx prisma migrate dev --name add_new_feature

# 3. Update template
npm run schema:template

# 4. Commit both
git add prisma/schema.template.prisma prisma/migrations/
git commit -m "feat: Add new feature"

# 5. When deploying
TABLE_PREFIX=PROD npm run schema:generate
npx prisma migrate deploy
```

### Multi-Client Deployment

```bash
# Client A
export TABLE_PREFIX=CLIENT_A
npm run schema:generate
npx prisma migrate deploy --
DATABASE_URL=$CLIENT_A_DB

# Client B
export TABLE_PREFIX=CLIENT_B
npm run schema:generate
npx prisma migrate deploy --
DATABASE_URL=$CLIENT_B_DB
```

### Docker/Containerized

```dockerfile
FROM node:18

ARG TABLE_PREFIX=DEFAULT_PF

WORKDIR /app
COPY . .

ENV TABLE_PREFIX=${TABLE_PREFIX}

RUN npm install
RUN npm run schema:generate
RUN npm run db:migrate

CMD ["npm", "start"]
```

Build:
```bash
docker build --build-arg TABLE_PREFIX=PROD -t pf-scoring:prod .
docker run -e DATABASE_URL=... pf-scoring:prod
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy PF Scoring

on:
  push:
    branches: [main]

env:
  TABLE_PREFIX: ${{ secrets.TABLE_PREFIX }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install
      
      - name: Generate schema
        run: npm run schema:generate
      
      - name: Apply migrations
        run: npx prisma migrate deploy
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        run: vercel --prod
```

---

## Examples

### Example 1: Single App, Three Environments

**Scenario:** Deploy same codebase to Dev/Staging/Prod

**Setup:**

```bash
# .env.development
TABLE_PREFIX=DEV_APP
DATABASE_URL=postgresql://user:pass@localhost/pf_dev

# .env.staging
TABLE_PREFIX=STAGING_APP
DATABASE_URL=postgresql://user:pass@staging/pf_staging

# .env.production
TABLE_PREFIX=PROD_APP
DATABASE_URL=postgresql://user:pass@prod/pf_prod
```

**Deployment:**

```bash
# Install dependencies
npm install

# Generate schema for current environment
npm run schema:generate

# Apply migrations
npx prisma migrate deploy

# Deploy app
npm run build && npm run start
```

**Result:**

Three separate database schemas in same or different databases:
- `DEV_APP_users`, `DEV_APP_projects`, ...
- `STAGING_APP_users`, `STAGING_APP_projects`, ...
- `PROD_APP_users`, `PROD_APP_projects`, ...

### Example 2: Multi-Tenant SaaS

**Scenario:** One Vercel app, multiple client databases

**Architecture:**
```
Single Vercel Deployment
    ├─ Database Router (middleware)
    │  └─ Routes based on subdomain/header to correct DB
    ├─ Client A Database
    │  ├─ CLIENTE_A_users
    │  └─ CLIENTE_A_projects
    ├─ Client B Database
    │  ├─ CLIENTE_B_users
    │  └─ CLIENTE_B_projects
    └─ Client C Database
       ├─ CLIENTE_C_users
       └─ CLIENTE_C_projects
```

**Implementation:**

1. **Prepare Schema for Each Client**

```bash
# Client A
TABLE_PREFIX=CLIENTE_A npm run schema:generate
npx prisma migrate deploy --preview-feature  # First client

# Client B (uses already-created migrations)
TABLE_PREFIX=CLIENTE_B npm run schema:generate
npx prisma migrate deploy --skip-generate

# Client C
TABLE_PREFIX=CLIENTE_C npm run schema:generate
npx prisma migrate deploy --skip-generate
```

2. **Runtime Database Selection**

```typescript
// lib/multi-tenant-prisma.ts
import { PrismaClient } from '@prisma/client';

const prismaInstances = new Map<string, PrismaClient>();

export function getPrismaForTenant(clientId: string) {
  if (!prismaInstances.has(clientId)) {
    const dbUrl = getClientDatabaseUrl(clientId);
    prismaInstances.set(clientId, new PrismaClient({
      datasources: {
        db: { url: dbUrl }
      }
    }));
  }
  return prismaInstances.get(clientId);
}

function getClientDatabaseUrl(clientId: string): string {
  // Lookup from config
  const urls: Record<string, string> = {
    'cliente_a': process.env.CLIENTE_A_DATABASE_URL!,
    'cliente_b': process.env.CLIENTE_B_DATABASE_URL!,
    'cliente_c': process.env.CLIENTE_C_DATABASE_URL!,
  };
  return urls[clientId] || '';
}
```

3. **Middleware for Client Detection**

```typescript
// lib/tenant-middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export async function withTenant(
  request: NextRequest,
  handler: (req: NextRequest, clientId: string) => Promise<NextResponse>
) {
  // Extract client from subdomain, header, or URL
  const clientId = request.headers.get('x-client-id') ||
                   new URL(request.url).hostname.split('.')[0];
  
  if (!clientId) {
    return NextResponse.json({ error: 'Client not identified' }, { status: 400 });
  }
  
  return handler(request, clientId);
}
```

4. **API Route Usage**

```typescript
// app/api/projects/route.ts
import { getPrismaForTenant } from '@/lib/multi-tenant-prisma';
import { withTenant } from '@/lib/tenant-middleware';

export async function GET(request: NextRequest) {
  return withTenant(request, async (req, clientId) => {
    const prisma = getPrismaForTenant(clientId);
    const projects = await prisma.project.findMany();
    return NextResponse.json({ data: projects });
  });
}
```

### Example 3: Kubernetes Deployment

**Scenario:** Multiple pod replicas, same prefix

**ConfigMap:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pf-scoring-config
data:
  TABLE_PREFIX: "K8S_PF"
  DATABASE_URL: "postgresql://user:pass@postgres-service/pf_db"
```

**Deployment:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pf-scoring
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: pf-scoring
        image: pf-scoring:latest
        env:
        - name: TABLE_PREFIX
          valueFrom:
            configMapKeyRef:
              name: pf-scoring-config
              key: TABLE_PREFIX
        - name: DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: pf-scoring-config
              key: DATABASE_URL
        lifecycle:
          postStart:
            exec:
              command: ["/bin/sh", "-c", "npm run schema:generate && npx prisma migrate deploy"]
```

---

## Migration Strategy

### Adding a New Table

1. **Edit schema.template.prisma**

```prisma
model NewEntity {
  id    String  @id @default(uuid())
  name  String

  @@map("__TABLE_PREFIX___new_entities")
}
```

2. **Generate for your environment**

```bash
npm run schema:generate
```

3. **Create migration**

```bash
npx prisma migrate dev --name add_new_entity
```

4. **Commit template**

```bash
git add prisma/schema.template.prisma prisma/migrations/
git commit -m "feat: Add new entity"
```

5. **Deploy to other environments**

```bash
# Staging
TABLE_PREFIX=STAGING npm run schema:generate
npx prisma migrate deploy

# Production
TABLE_PREFIX=PROD npm run schema:generate
npx prisma migrate deploy
```

### Renaming a Table

1. **Create migration (creates new table)**

```bash
npx prisma migrate dev --name rename_users_to_accounts
```

2. **In migration, add data copy**

```sql
-- prisma/migrations/xxx_rename_users_to_accounts/migration.sql
ALTER TABLE "__TABLE_PREFIX___users" RENAME TO "__TABLE_PREFIX___accounts";
```

3. **Update schema.template.prisma**

```prisma
model Account {
  @@map("__TABLE_PREFIX___accounts")
}
```

4. **Deploy everywhere**

```bash
TABLE_PREFIX=PROD npm run schema:generate && npx prisma migrate deploy
```

---

## Troubleshooting

### "Foreign key constraint failed"

**Cause:** Tables have different prefixes

```bash
# Check current prefix
echo $TABLE_PREFIX

# This should be consistent across all tables
grep "@@map" prisma/schema.prisma | sort | uniq
```

**Fix:** Regenerate schema with correct prefix

```bash
TABLE_PREFIX=PROD npm run schema:generate
```

### "Placeholder not replaced"

**Cause:** Template doesn't exist or prefix not set

```bash
# Check template
ls -la prisma/schema.template.prisma

# Create if missing
npm run schema:template

# Check placeholder
grep "__TABLE_PREFIX__" prisma/schema.template.prisma
```

### "Migration conflicts with prefix"

**Cause:** Migrations written with hardcoded prefix

**Fix:** Migrations must use placeholders

```sql
-- ❌ Wrong
CREATE TABLE "PROD_users" (...)

-- ✅ Correct
CREATE TABLE "__TABLE_PREFIX___users" (...)
```

All migrations should use `__TABLE_PREFIX__` which gets replaced at runtime.

### "Can't connect to database"

**Cause:** Wrong DATABASE_URL for prefix

```bash
# Verify URL is for correct environment
echo $DATABASE_URL

# Test connection
npx prisma db execute --stdin < /dev/null
```

---

## Best Practices

### ✅ Do

- Keep `schema.template.prisma` committed
- Set `TABLE_PREFIX` before generating schema
- Use environment-specific `.env` files
- Generate schema as part of deployment
- Document client prefix mapping

### ❌ Don't

- Hardcode prefix in migrations
- Commit generated `schema.prisma`
- Use different prefixes in same environment
- Manually edit generated schema
- Forget to regenerate after prefix change

---

## Monitoring

### Verify Deployment

```bash
# Connect to database
psql $DATABASE_URL

# List tables
\dt

# Should show PREFIX_* pattern
```

### Check Active Prefix

```typescript
// In API route
console.log('Active prefix:', process.env.TABLE_PREFIX);

// Query shows which tables are used
const tables = await prisma.$queryRaw`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public'
`;
```

---

## Code References

- **Template Script**: `/scripts/create-template.js`
- **Generation Script**: `/scripts/generate-schema.js`
- **Strategy Doc**: `/docs/TABLE_PREFIX_STRATEGY.md`
- **Configuration**: `.env`, `.env.example`
- **Schema**: `/prisma/schema.template.prisma`, `/prisma/schema.prisma`

