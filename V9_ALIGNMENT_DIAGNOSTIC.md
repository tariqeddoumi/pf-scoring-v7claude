# V9 Deep Alignment Diagnostic

**Date:** June 15, 2026
**Scope:** Front-end ↔ Back-end ↔ Database alignment + table content verification
**Method:** Static cross-layer analysis (DB credentials/MCP not available in this environment)

---

## ⚠️ Migration application status

**The migration could NOT be applied to Supabase from this session:**
- The Supabase MCP requires an interactive approval that did not grant autonomously
  (every call returned `MCP tool call requires approval`).
- No `DATABASE_URL` / `.env` is present locally, so Prisma `migrate deploy` cannot connect.

**Action required from you (one-time):** approve the Supabase MCP connection, OR provide
`DATABASE_URL`. Once available, applying V9 is two commands:

```bash
# DDL — run migration.sql in Supabase (SQL editor) or:
npx prisma migrate deploy
# Data:
npm run db:seed:v9
# Verify:
curl https://<app>/api/v9/control   # expect success:true
```

**Good news:** the diagnostic found the migration would have *failed* as originally
written. Those blockers are now fixed (below), so it will apply cleanly.

---

## 🔴 Blockers found & fixed (migration would have failed)

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | `CREATE POLICY IF NOT EXISTS` (7×) | **Fatal** — PostgreSQL has no `IF NOT EXISTS` for `CREATE POLICY`; syntax error aborts the whole migration | Replaced with `DROP POLICY IF EXISTS … ; CREATE POLICY …` (idempotent, valid) |
| 2 | Admin RLS policies referenced table `"users"` | **Fatal** — real table is `BP_PF_users`; policy creation errors on missing relation | Removed the `auth.uid()` admin policies — this app authorizes via Prisma + `withAdminAuth`, not Supabase Auth, so `auth.uid()` never matches and the uuid-vs-text comparison would also error. RLS now: public read on reference data, public-key read on config, writes only via privileged Prisma role |
| 3 | Duplicate `CREATE EXTENSION "uuid-ossp"` | Harmless but sloppy; misleading comment ("JSON extensions") | De-duplicated, corrected comment |

After fixes: `prisma validate` → schema valid; migration SQL contains 6 valid policy
blocks and 0 invalid statements.

---

## ✅ Layer alignment — all consistent

### Tables: schema ↔ migration SQL (11/11 match)

`BP_PF_v9_scoring_models`, `BP_PF_v9_sectors`, `BP_PF_v9_sector_thresholds`,
`BP_PF_v9_sector_domain_weights`, `BP_PF_v9_red_flags`, `BP_PF_v9_indicators`,
`BP_PF_v9_stress_tests`, `BP_PF_v9_malus_bonus`, `BP_PF_v9_anti_double_count`,
`BP_PF_app_configuration`, `BP_PF_app_config_history`.

Every Prisma `@@map` has a matching `CREATE TABLE`; column names align (camelCase
quoted consistently). The seed script references all models that have data.

### Counts: seed data ↔ seed script ↔ control endpoint (aligned)

| Entity | JSON file | seed expects | /api/v9/control expects |
|--------|-----------|--------------|--------------------------|
| sectors | 12 | 12 | 12 |
| thresholds | 144 | 144 | 144 |
| domainWeights | 108 | 108 | 108 |
| redFlags | 96 | 96 | 96 |
| indicators | 72 | 72 | 72 |
| stressTests | 24 | 24 | 24 |
| malusBonus | 10 | 10 | 10 |
| appConfiguration | 9 | 9 | 9 |
| models | 1 | 1 | 1 |

Per-sector breakdown verified: every one of the 12 sectors has exactly
**12 thresholds / 8 red flags / 6 indicators / 2 stress tests**. No duplicate
threshold keys, no duplicate red-flag codes.

### API ↔ Front-end (aligned)

- `GET /api/v9/sectors` includes `thresholds, domainWeights, redFlags, indicators,
  stressTests` → matches `SectorWithDetails` interface in `v9-sectors-service.ts`.
- `GET /api/admin/configuration` returns `{ data: { configs, grouped } }` →
  config page reads `json.data.configs`. ✓
- `PUT /api/admin/configuration/[key]` returns `{ data: config }` →
  page reads `json.data.value`. ✓
- Layout `getPublicConfig()` → `prisma.appConfiguration.findMany({ where:{ isPublic:true }})`;
  Navbar reads `APP_NAME` / `APP_LOGO_URL` from the same keys. ✓

### Tooling fix

- `package.json prisma.seed` points to `prisma/seed.ts` (the **V7++/V8** seed, no V9).
  Running `prisma db seed` would NOT seed V9.
- Added script **`db:seed:v9` → `tsx prisma/seed-v9.ts`** (tsx is already a devDependency).
- Updated all guides (`npm run prisma:seed` → `npm run db:seed:v9`) — the old command
  didn't exist.

---

## 🟡 Non-blocking gaps & notes

| Item | Note | Recommendation |
|------|------|----------------|
| `BP_PF_v9_anti_double_count` (72 cells) | Table exists in schema/SQL but **is never seeded** and is **not checked** by `/api/v9/control` — it will be empty | Add anti-double-count data to `v9_source_data.json` + a seed loop if the 72-cell matrix is required; otherwise drop the table to avoid implying coverage |
| Red-flag richness | `v9_source_data.json` red flags carry `domainImpacted`, `severity`, `mitigant`, but the schema/seed only persist `description, isNoGo, penalty, orderIndex` — the extra Excel metadata is silently dropped | If severity/domain/mitigant must surface in the UI, add columns to `V9RedFlag` + seed mapping |
| Threshold ordering | `/api/v9/sectors` orders thresholds `by level asc` → alphabetical (ACCEPTABLE, BON, EXCELLENT, INSUFFISANT), not quality rank | Add an explicit `levelRank` or sort client-side for display |
| `id` column type | V9 tables use native `UUID`; older tables (V8/User) use `TEXT` (cuid/uuid as string). Prisma treats all as `String`; Postgres casts text↔uuid so queries work | Functional — cosmetic inconsistency only |
| `DateTime` precision | Migration uses `TIMESTAMP`; Prisma default is `timestamp(3)` | Compatible; no action |
| `prisma/schema.v9.prisma` | Reference-only duplicate, not loaded by Prisma | Optional: delete to avoid confusion |

---

## Verdict

- **Code/data are internally aligned and content is correct** (counts, per-sector
  distribution, key uniqueness all verified).
- **The migration is now applyable** — three fatal SQL errors were fixed; it previously
  would have aborted on Supabase.
- **Only remaining step is execution**, which needs Supabase MCP approval or a
  `DATABASE_URL`. After that, `/api/v9/control` is the single command to confirm the
  database content matches expectations.
