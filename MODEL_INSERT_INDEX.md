# PF_V7PP Scoring Model - Complete Insertion Guide

## 📋 Table of Contents

1. **Quick Start** - Get running in 30 seconds
2. **What's Included** - List of all files created
3. **Installation Methods** - Choose your approach
4. **Execution Steps** - Detailed instructions
5. **Validation** - Verify the model is working
6. **Integration** - How it connects to your app

---

## 🚀 Quick Start (30 seconds)

### Method 1: Shell Script (Easiest)
```bash
chmod +x scripts/seed-pf-v7pp.sh
./scripts/seed-pf-v7pp.sh
```

### Method 2: Direct NPM
```bash
npx prisma db seed
```

### Method 3: Supabase Console
1. Open Supabase SQL Editor
2. Copy content from: `prisma/migrations/add_pf_v7pp_scoring_model.sql`
3. Paste and run

---

## 📦 What's Included

### Created Files

| File | Type | Purpose |
|------|------|---------|
| `prisma/seed.ts` | TypeScript | Prisma seed script (recommended) |
| `prisma/migrations/add_pf_v7pp_scoring_model.sql` | SQL | Raw SQL migration |
| `scripts/seed-pf-v7pp.sh` | Bash | Convenience script |
| `PF_V7PP_SETUP.md` | Documentation | Complete setup guide |
| `SEED_EXECUTION_SUMMARY.md` | Documentation | Execution summary |
| `MODEL_INSERT_INDEX.md` | Documentation | This file |

### What Gets Inserted

**1 Model** → **1 Version** → **9 Domains** → **28 Criteria** → **153 Options/Ranges**

```
PF_V7PP (Published Model)
├── D1: Financial Risk (15%)
│   └── 5 criteria: Leverage, DSCR, Interest Coverage, Reserves, Working Capital
├── D2: Technical Risk (15%)
│   └── 5 criteria: Technology, EPC, O&M, Performance, Supply Chain
├── D3: Market Risk (12%)
│   └── 4 criteria: Offtake, Demand, Pricing, Commodity
├── D4: Environmental & Social (12%)
│   └── 3 criteria: Environment, Social Impact, Stakeholder Management
├── D5: Governance & Management (12%)
│   └── 3 criteria: Sponsor, Board, Controls
├── D6: Legal & Regulatory (10%)
│   └── 3 criteria: Legal Structure, Regulation, Permits
├── D7: Country & Political (12%)
│   └── 3 criteria: Sovereign Risk, Currency, Political Insurance
├── D8: Project Structure (6%)
│   └── 2 criteria: Financial Covenants, Force Majeure
└── D9: Financial Stress Test (6%)
    └── 2 criteria: Stress Testing, Cost Overrun
```

---

## 🔧 Installation Methods

### Method A: Prisma Seed (Recommended) ⭐

**Pros:** Type-safe, idempotent, handles relationships, official method  
**Cons:** Requires Node.js

**Command:**
```bash
npx prisma db seed
```

**Files Used:**
- `prisma/seed.ts` (executed)
- `prisma/schema.prisma` (referenced)

**Time:** 5-10 seconds

---

### Method B: Shell Script

**Pros:** User-friendly, includes all checks, interactive  
**Cons:** Requires bash, still runs Prisma internally

**Command:**
```bash
./scripts/seed-pf-v7pp.sh
```

**What It Does:**
1. Checks prerequisites
2. Installs dependencies if needed
3. Generates Prisma client
4. Verifies database connection
5. Runs seed script
6. Provides next steps

**Time:** 10-15 seconds (includes checks)

---

### Method C: Direct SQL Execution

**Pros:** Direct database access, no Node.js needed  
**Cons:** Raw SQL, requires manual verification

**Steps:**
1. Go to https://app.supabase.com
2. Open SQL Editor in your project
3. Create new query
4. Copy entire content from: `prisma/migrations/add_pf_v7pp_scoring_model.sql`
5. Click "Run"
6. Verify completion message

**Time:** 3-5 seconds

---

### Method D: Using Prisma Migrate

**Pros:** Creates permanent migration, tracked in version control  
**Cons:** More complex for initial setup

**Command:**
```bash
# Create migration from existing seed file (if needed)
npx prisma migrate dev --name add_pf_v7pp_model

# Or just apply existing migration
npx prisma migrate deploy
```

---

## ✅ Execution Steps

### Using Prisma (Recommended)

1. **Ensure database is connected:**
   ```bash
   npx prisma db execute --stdin < /dev/null
   ```

2. **Generate Prisma client (if needed):**
   ```bash
   npx prisma generate
   ```

3. **Run seed:**
   ```bash
   npx prisma db seed
   ```

4. **Expected output:**
   ```
   🌱 Starting database seed: PF_V7PP Scoring Model...
   📦 Creating ScoringModel (PF_V7PP)...
   ✅ ScoringModel: [uuid]
   📋 Creating ScoringModelVersion...
   ✅ ScoringModelVersion: [uuid]
   🏗️  Creating 9 Domains with Criteria, Options, and Ranges...
   ✅ Domains created: 9
   ✅ Criteria created: 28
   ✅ Options created: 123
   ✅ Ranges created: 30
   ```

### Using Shell Script

```bash
# 1. Make executable (if not already)
chmod +x scripts/seed-pf-v7pp.sh

# 2. Run the script
./scripts/seed-pf-v7pp.sh

# 3. Follow prompts and view results
```

### Using Supabase Console

1. **Open Supabase dashboard:** https://app.supabase.com
2. **Select your project**
3. **Click "SQL Editor"** in left sidebar
4. **Click "New Query"**
5. **Copy entire content** from `prisma/migrations/add_pf_v7pp_scoring_model.sql`
6. **Paste into editor**
7. **Click "Run"** button
8. **Check output** at bottom for confirmation

---

## 🔍 Validation Queries

After executing the seed, verify it worked:

### Quick Check (Counts)
```sql
SELECT 
  'Models' as entity, COUNT(*) FROM "BP_PF_v7pp_scoring_models" WHERE code='PF_V7PP'
UNION ALL
SELECT 'Domains', COUNT(*) FROM "BP_PF_v7pp_scoring_nodes" WHERE "nodeType"='DOMAIN'
UNION ALL
SELECT 'Criteria', COUNT(*) FROM "BP_PF_v7pp_scoring_nodes" WHERE "nodeType"='CRITERION'
UNION ALL
SELECT 'Options', COUNT(*) FROM "BP_PF_v7pp_scoring_options"
UNION ALL
SELECT 'Ranges', COUNT(*) FROM "BP_PF_v7pp_scoring_ranges";
```

**Expected Results:**
- Models: 1
- Domains: 9
- Criteria: 28
- Options: 123
- Ranges: 30

### Detailed Check (Model Status)
```sql
SELECT 
  m.code,
  m.label,
  m.status,
  v.versionNumber,
  v.status as version_status,
  v."isPublished"
FROM "BP_PF_v7pp_scoring_models" m
JOIN "BP_PF_v7pp_scoring_versions" v ON m.id = v."modelId"
WHERE m.code = 'PF_V7PP';
```

**Expected Results:**
- code: PF_V7PP
- status: PUBLISHED
- isPublished: true

### View Domain Structure
```sql
SELECT 
  d.code,
  d.label,
  d.weight,
  COUNT(c.id) as criteria_count
FROM "BP_PF_v7pp_scoring_nodes" d
LEFT JOIN "BP_PF_v7pp_scoring_nodes" c ON c."parentNodeId" = d.id
WHERE d."nodeType" = 'DOMAIN'
GROUP BY d.id, d.code, d.label, d.weight
ORDER BY d."orderIndex";
```

---

## 🔗 Integration with Application

Once seeded, the model automatically integrates:

### 1. Questionnaire API
**Endpoint:** `GET /api/scoring/questionnaire`

**Returns:** Tree structure of all domains and criteria
```json
{
  "data": [
    {
      "id": "...",
      "code": "D1",
      "label": "Financial Risk",
      "depth": 0,
      "weight": 0.15,
      "children": [
        {
          "id": "...",
          "code": "D1_C1",
          "label": "Leverage Ratio",
          "answerType": "NUMERIC_RANGE",
          "ranges": [...]
        }
      ]
    }
  ],
  "modelVersionId": "..."
}
```

### 2. Evaluation Creation
**Endpoint:** `POST /api/scoring/evaluations`

**Behavior:** Automatically links created evaluation to published PF_V7PP model

### 3. Evaluation Workspace UI
**Route:** `/evaluations/new`

**Features:**
- Left sidebar: 9 domains with progress bars
- Main panel: Criteria for selected domain
- Right panel: Real-time score calculation
- Automatic score aggregation based on weights

### 4. Score Calculation
- **Criterion score:** From selected option or numeric range
- **Domain score:** Average of criteria scores
- **Overall score:** Weighted average of domain scores
- **Rating:** Maps score to grade (AAA ≥90, AA ≥80, ..., D <30)

---

## ⚙️ Troubleshooting

### Issue: "Error: could not connect to database"

**Solution:**
```bash
# Check .env.local has DATABASE_URL
cat .env.local | grep DATABASE_URL

# Verify connection
npx prisma db execute --stdin < /dev/null
```

### Issue: "User not found" error

**Solution:**
```bash
# Create a test user first
npx prisma studio

# Or via SQL:
INSERT INTO "BP_PF_users" (id, email, nom, prenom, role)
VALUES (gen_random_uuid(), 'test@example.com', 'Test', 'User', 'admin');
```

### Issue: Model doesn't appear in evaluation workspace

**Solution:**
```bash
# 1. Check model is published
SELECT "isPublished" FROM "BP_PF_v7pp_scoring_versions" LIMIT 1;

# 2. Check nodes exist
SELECT COUNT(*) FROM "BP_PF_v7pp_scoring_nodes";

# 3. Test API
curl -X GET http://localhost:3000/api/scoring/questionnaire
```

### Issue: Need to re-seed the model

**Solution:**
```bash
# Safe to run multiple times - uses upserts
npx prisma db seed

# If you want to completely reset:
# Option 1: Delete via SQL
DELETE FROM "BP_PF_v7pp_scoring_models" WHERE code='PF_V7PP';
# Then re-seed

# Option 2: Use Prisma reset (resets entire DB)
npx prisma migrate reset
npx prisma db seed
```

---

## 📊 Model Statistics

### Coverage
- ✅ 9 major risk domains (covers IFC, EBRD, Basel)
- ✅ 28 detailed assessment criteria
- ✅ 123 predefined scoring options
- ✅ 30 numeric assessment ranges
- ✅ Weighted scoring system (100% = 1.0)

### Domains & Weights
1. Financial Risk: 15%
2. Technical Risk: 15%
3. Market Risk: 12%
4. Environmental & Social: 12%
5. Governance & Management: 12%
6. Legal & Regulatory: 10%
7. Country & Political: 12%
8. Project Structure: 6%
9. Financial Stress Test: 6%

### Answer Types
- **OPTION_SINGLE:** 18 criteria with predefined options
- **NUMERIC_RANGE:** 10 criteria with score bands

---

## 📚 Complete Documentation

For more details, see:

- **PF_V7PP_SETUP.md** - Complete setup guide with all validation queries
- **SEED_EXECUTION_SUMMARY.md** - Detailed execution summary
- **prisma/schema.prisma** - Database schema definitions
- **app/api/scoring/** - API endpoints implementation

---

## 🎯 Next Steps After Seeding

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Visit evaluation creation page:**
   ```
   http://localhost:3000/evaluations/new
   ```

3. **Create a test evaluation:**
   - Select a project
   - Click "Lancer l'évaluation"
   - Verify 9 domains appear in left sidebar

4. **Test a criterion:**
   - Click on a domain (e.g., "Financial Risk")
   - Answer a criterion
   - Check real-time score update in right panel

5. **Verify score calculation:**
   - Answer multiple criteria
   - Observe domain scores update
   - Check overall score calculation

---

## ✨ Success Indicators

After seeding, you should see:

- ✅ 1 published model (PF_V7PP)
- ✅ 9 domains in evaluation workspace
- ✅ 28+ criteria available for answering
- ✅ Real-time score updates as you answer
- ✅ All 9 domains showing progress in sidebar
- ✅ Final overall score calculation

---

## 📞 Getting Help

If you encounter issues:

1. **Check logs:**
   ```bash
   DEBUG=* npx prisma db seed
   ```

2. **Review database state:**
   - Use Supabase dashboard to inspect tables
   - Run validation queries above

3. **Consult documentation:**
   - See PF_V7PP_SETUP.md for detailed guide
   - Check prisma/schema.prisma for schema details

---

**Version:** 1.0  
**Status:** Ready for Production  
**Last Updated:** April 2026  
**Time to Execute:** < 5 minutes
