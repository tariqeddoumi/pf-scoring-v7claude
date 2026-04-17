# PF_V7PP Scoring Model Setup Guide

## Overview

This guide explains how to insert the **PF_V7PP** scoring model into your Supabase PostgreSQL database. The model includes:

- **9 Domains** with hierarchical structure
- **28 Criteria** covering all risk categories
- **123+ Scoring Options** for multiple-choice answers
- **30+ Numeric Ranges** for quantitative assessments

### Model Structure

```
PF_V7PP (ScoringModel)
├── D1: Financial Risk (15% weight)
│   ├── D1_C1: Leverage Ratio (25% weight) - NUMERIC_RANGE
│   ├── D1_C2: DSCR (25% weight) - NUMERIC_RANGE
│   ├── D1_C3: Interest Coverage (20% weight) - NUMERIC_RANGE
│   ├── D1_C4: Reserve Adequacy (15% weight) - OPTION_SINGLE
│   └── D1_C5: Working Capital (15% weight) - OPTION_SINGLE
├── D2: Technical Risk (15% weight)
│   ├── D2_C1: Technology Maturity - OPTION_SINGLE
│   ├── D2_C2: EPC Contractor Quality - OPTION_SINGLE
│   ├── D2_C3: O&M Capability - OPTION_SINGLE
│   ├── D2_C4: Plant Performance - OPTION_SINGLE
│   └── D2_C5: Supply Chain Risk - OPTION_SINGLE
├── D3: Market Risk (12% weight)
│   ├── D3_C1: Offtake Agreements - OPTION_SINGLE
│   ├── D3_C2: Market Demand - OPTION_SINGLE
│   ├── D3_C3: Pricing Mechanism - OPTION_SINGLE
│   └── D3_C4: Commodity Price Risk - OPTION_SINGLE
├── D4: Environmental & Social Risk (12% weight)
│   ├── D4_C1: Environmental Compliance - OPTION_SINGLE
│   ├── D4_C2: Social Impact - OPTION_SINGLE
│   └── D4_C3: Stakeholder Management - OPTION_SINGLE
├── D5: Governance & Management Risk (12% weight)
│   ├── D5_C1: Sponsor Strength - OPTION_SINGLE
│   ├── D5_C2: Board & Management - OPTION_SINGLE
│   └── D5_C3: Internal Controls - OPTION_SINGLE
├── D6: Legal & Regulatory Risk (10% weight)
│   ├── D6_C1: Legal Structure - OPTION_SINGLE
│   ├── D6_C2: Regulatory Framework - OPTION_SINGLE
│   └── D6_C3: Permits & Licenses - OPTION_SINGLE
├── D7: Country & Political Risk (12% weight)
│   ├── D7_C1: Sovereign Risk - OPTION_SINGLE
│   ├── D7_C2: Currency & Transfer Risk - OPTION_SINGLE
│   └── D7_C3: Political Risk Insurance - OPTION_SINGLE
├── D8: Project Structure Risk (6% weight)
│   ├── D8_C1: Financial Covenants - OPTION_SINGLE
│   └── D8_C2: Force Majeure Provisions - OPTION_SINGLE
└── D9: Financial Stress Test (6% weight)
    ├── D9_C1: Stress Scenario Testing - NUMERIC_RANGE
    └── D9_C2: Cost Overrun Scenario - NUMERIC_RANGE
```

---

## Installation Method 1: Prisma Seed Script (Recommended)

This method uses TypeScript and Prisma ORM for safe, idempotent execution.

### Prerequisites
- Node.js 18+ installed
- `npm` available
- `.env.local` configured with `DATABASE_URL`

### Steps

1. **Run the seed script:**
   ```bash
   npx prisma db seed
   ```

2. **Expected Output:**
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
   
   ============================================================
   🎉 Seed completed successfully!
   ============================================================
   ```

3. **Verify in Supabase:**
   ```sql
   SELECT code, label, status, "isPublished"
   FROM "BP_PF_v7pp_scoring_models" m
   JOIN "BP_PF_v7pp_scoring_versions" v ON m.id = v."modelId"
   WHERE m.code = 'PF_V7PP'
   LIMIT 1;
   ```

---

## Installation Method 2: Direct SQL Execution

For direct database access without Node.js.

### Prerequisites
- Access to Supabase SQL Editor or psql CLI
- Connection string to your database

### Steps

1. **Open Supabase SQL Editor:**
   - Go to https://app.supabase.com
   - Select your project
   - Click "SQL Editor"
   - Create new query

2. **Copy and paste the migration:**
   - File: `prisma/migrations/add_pf_v7pp_scoring_model.sql`
   - Paste entire content into SQL editor
   - Click "Run"

3. **Verify execution:**
   - Check for completion message at bottom
   - Verify row counts in each table

4. **Verify results:**
   ```sql
   SELECT 'Models' as entity, COUNT(*) FROM "BP_PF_v7pp_scoring_models" WHERE code='PF_V7PP'
   UNION ALL
   SELECT 'Versions', COUNT(*) FROM "BP_PF_v7pp_scoring_versions" WHERE "modelId" IN (SELECT id FROM "BP_PF_v7pp_scoring_models" WHERE code='PF_V7PP')
   UNION ALL
   SELECT 'Domains', COUNT(*) FROM "BP_PF_v7pp_scoring_nodes" WHERE "nodeType"='DOMAIN' AND "versionId" IN (SELECT v.id FROM "BP_PF_v7pp_scoring_versions" v JOIN "BP_PF_v7pp_scoring_models" m ON v."modelId" = m.id WHERE m.code='PF_V7PP')
   UNION ALL
   SELECT 'Criteria', COUNT(*) FROM "BP_PF_v7pp_scoring_nodes" WHERE "nodeType"='CRITERION' AND "versionId" IN (SELECT v.id FROM "BP_PF_v7pp_scoring_versions" v JOIN "BP_PF_v7pp_scoring_models" m ON v."modelId" = m.id WHERE m.code='PF_V7PP');
   ```

---

## Validation Queries

### Check if Model is Published
```sql
SELECT 
  m.code,
  m.label,
  v.versionNumber,
  v.isPublished,
  v.status
FROM "BP_PF_v7pp_scoring_models" m
JOIN "BP_PF_v7pp_scoring_versions" v ON m.id = v."modelId"
WHERE m.code = 'PF_V7PP'
  AND v.isPublished = true;
```

**Expected Result:** One row with `isPublished=true`

### Count Domains
```sql
SELECT COUNT(*) as domain_count
FROM "BP_PF_v7pp_scoring_nodes"
WHERE "nodeType" = 'DOMAIN'
  AND "versionId" IN (
    SELECT v.id FROM "BP_PF_v7pp_scoring_versions" v
    JOIN "BP_PF_v7pp_scoring_models" m ON v."modelId" = m.id
    WHERE m.code = 'PF_V7PP'
  );
```

**Expected Result:** 9

### View All Domains with Criteria
```sql
SELECT 
  d.code,
  d.label,
  d.weight,
  COUNT(c.id) as criterion_count
FROM "BP_PF_v7pp_scoring_nodes" d
LEFT JOIN "BP_PF_v7pp_scoring_nodes" c ON c."parentNodeId" = d.id AND c."nodeType" = 'CRITERION'
WHERE d."nodeType" = 'DOMAIN'
  AND d."versionId" IN (
    SELECT v.id FROM "BP_PF_v7pp_scoring_versions" v
    JOIN "BP_PF_v7pp_scoring_models" m ON v."modelId" = m.id
    WHERE m.code = 'PF_V7PP'
  )
GROUP BY d.id, d.code, d.label, d.weight
ORDER BY d."orderIndex";
```

### Check Scoring Options for a Criterion
```sql
SELECT 
  n.code,
  n.label,
  o.label as option_label,
  o.value,
  o.score
FROM "BP_PF_v7pp_scoring_nodes" n
JOIN "BP_PF_v7pp_scoring_options" o ON o."nodeId" = n.id
WHERE n.code = 'D1_C4'  -- Reserve Adequacy
ORDER BY o."orderIndex";
```

### Check Ranges for a Numeric Criterion
```sql
SELECT 
  n.code,
  n.label,
  r.label as range_label,
  r."minValue",
  r."maxValue",
  r.score
FROM "BP_PF_v7pp_scoring_nodes" n
JOIN "BP_PF_v7pp_scoring_ranges" r ON r."nodeId" = n.id
WHERE n.code = 'D1_C1'  -- Leverage Ratio
ORDER BY r."orderIndex";
```

---

## Integration with Evaluations

Once the model is seeded, it will be automatically loaded by:

1. **Questionnaire API:**
   ```
   GET /api/scoring/questionnaire
   ```
   - Returns the tree structure of all domains and criteria
   - Used by the evaluation workspace UI

2. **Evaluation Creation:**
   ```
   POST /api/scoring/evaluations
   ```
   - Automatically links to the published PF_V7PP model
   - Fetches the latest published version

3. **Evaluation Workspace:**
   - Shows the 9 domains in the left sidebar
   - Displays criteria by domain
   - Provides input fields based on answer type (OPTION_SINGLE or NUMERIC_RANGE)
   - Calculates scores in real-time using options/ranges

---

## Troubleshooting

### Model Not Appearing in Evaluations

**Check 1: Is the version published?**
```sql
SELECT * FROM "BP_PF_v7pp_scoring_versions"
WHERE "isPublished" = true
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Check 2: Do nodes exist for the version?**
```sql
SELECT COUNT(*) FROM "BP_PF_v7pp_scoring_nodes"
WHERE "versionId" = '[version_id_from_check_1]';
```

**Check 3: Are options/ranges created?**
```sql
SELECT COUNT(*) as option_count FROM "BP_PF_v7pp_scoring_options"
WHERE "nodeId" IN (
  SELECT id FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "versionId" = '[version_id]'
);
```

### Re-running the Seed

The seed script is **idempotent** - it can be run multiple times safely:

```bash
# Safe to run multiple times
npx prisma db seed
```

Changes made:
- Existing models will be updated (not duplicated)
- Existing domains/criteria will be updated
- New options/ranges will be added if missing

### Manual Cleanup

If you need to reset the model and reseed:

```sql
-- Delete the version (cascades to all nodes)
DELETE FROM "BP_PF_v7pp_scoring_versions"
WHERE "modelId" IN (
  SELECT id FROM "BP_PF_v7pp_scoring_models"
  WHERE code = 'PF_V7PP'
);

-- Delete the model
DELETE FROM "BP_PF_v7pp_scoring_models"
WHERE code = 'PF_V7PP';

-- Then run seed again
-- npx prisma db seed
```

---

## Data Dictionary

### ScoringNode Types

| Type | Purpose | Has Children | Has Answer Type |
|------|---------|--------------|-----------------|
| DOMAIN | Top-level risk categories | Yes | No |
| CRITERION | Scoring criteria | No | Yes |
| SUB_CRITERION | Future: sub-criteria (not used in v1) | No | Yes |
| SUB_SUB_CRITERION | Future: sub-sub-criteria (not used in v1) | No | Yes |

### Answer Types

| Type | Input | Range Type | Options |
|------|-------|-----------|---------|
| OPTION_SINGLE | Dropdown select | No | Yes - predefined options |
| NUMERIC_RANGE | Number input | Yes - score bands | No |

### Score Calculations

**For OPTION_SINGLE:**
- User selects one option
- Score is the option's score value
- Example: "Excellent" = 90 points

**For NUMERIC_RANGE:**
- User enters numeric value
- Score is determined by which range the value falls into
- Example: DSCR 1.35 falls in "Good (1.3-1.5)" range = 75 points

**Domain Score:**
- Average of all non-null criterion scores
- Example: Domain D1 with 5 criteria scored: (90+75+60+50+25)/5 = 60

**Overall Score:**
- Weighted average of all domain scores
- Weights sum to 1.0 (15% + 15% + 12% + ... = 100%)
- Formula: SUM(domain_score × domain_weight)

---

## Support

If you encounter issues:

1. **Check Prisma logs:**
   ```bash
   # Increase verbosity
   DEBUG=* npx prisma db seed
   ```

2. **Verify database connectivity:**
   ```bash
   npx prisma db push --skip-generate
   ```

3. **Review migration file:**
   - File: `prisma/migrations/add_pf_v7pp_scoring_model.sql`
   - Check for column names matching your schema

4. **Export schema:**
   ```bash
   npx prisma introspect
   ```

---

**Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Production Ready ✅
