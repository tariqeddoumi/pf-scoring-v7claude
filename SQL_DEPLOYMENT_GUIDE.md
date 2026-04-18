# SQL Deployment Guide - PF Scoring v7pp

## Overview

This guide explains how to deploy the PF Scoring v7pp system to Supabase or any PostgreSQL database using the complete setup script.

## Files Provided

### 1. `SUPABASE_COMPLETE_SETUP.sql` (Primary)
**Complete, production-ready SQL script containing:**
- Configuration tables (answer types, aggregation methods, weight modes, score scales, rating scales)
- Data binding tables for execution tracking
- Flexible scoring configuration columns
- Model-level configuration fields
- Default configuration data (6 answer types, 6 aggregation methods, 3 weight modes, 4 score scales, 10 rating scales)
- Verification queries
- Complete comments and documentation

**Idempotent:** Safe to run multiple times - uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`

## Deployment Methods

### Method 1: Supabase Dashboard (Recommended)

1. **Log in to Supabase**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Paste and Execute**
   - Open `SUPABASE_COMPLETE_SETUP.sql`
   - Copy entire contents
   - Paste into Supabase SQL editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Results**
   - Script includes verification queries
   - Should see:
     ```
     Answer Types: 6 rows
     Aggregation Methods: 6 rows
     Weight Modes: 3 rows
     Score Scales: 4 rows
     Rating Scales: 10 rows
     ```

### Method 2: psql Command Line (Local PostgreSQL)

```bash
# Using psql locally or with remote connection
psql -h your-host -U your-user -d your-database -f SUPABASE_COMPLETE_SETUP.sql

# Or via standard input
cat SUPABASE_COMPLETE_SETUP.sql | psql -h your-host -U your-user -d your-database
```

### Method 3: Docker with PostgreSQL

```bash
# If using Docker PostgreSQL
docker exec postgres-container psql -U postgres -d your-database -f /path/to/SUPABASE_COMPLETE_SETUP.sql
```

### Method 4: Prisma Migrations (Alternative)

The script is also available as individual Prisma migrations in `/prisma/migrations/`:

```bash
# Apply all pending migrations
npx prisma migrate deploy

# Or in development
npm run dev  # Auto-applies migrations
```

## What Gets Created

### Tables

1. **BP_PF_v7pp_answer_types** (6 records)
   - OPTION_SINGLE, OPTION_MULTI, NUMERIC_RANGE, BOOLEAN, TEXT, NUMERIC

2. **BP_PF_v7pp_aggregation_methods** (6 records)
   - AVERAGE, WEIGHTED_AVERAGE, SUM, MIN, MAX, FIRST

3. **BP_PF_v7pp_weight_modes** (3 records)
   - RELATIVE, ABSOLUTE, NONE

4. **BP_PF_v7pp_score_scales** (4 records)
   - 0-100, 0-10, 1-5, 0-1

5. **BP_PF_v7pp_rating_scales** (10 records)
   - AAA, AA, A, BBB, BB, B, CCC, CC, C, D

6. **BP_PF_v7pp_node_data_bindings** (new)
   - Data binding configuration for execution tracking
   - Source entity mapping, transformations, auto-fill

### Columns Added to Existing Tables

**BP_PF_v7pp_scoring_nodes:**
- `scoreLeafDepth: INTEGER` - Depth at which scoring occurs
- `isScoringLeaf: BOOLEAN` - Is this a scoring input point?

**BP_PF_v7pp_evaluation_answers:**
- `sourceType, sourceEntity, sourceField, sourcePath` - Source tracking
- `sourceBindingId` - Reference to data binding
- `sourceValueSnapshotJson, resolvedValueSnapshotJson` - Value history
- `isAutoFilled, isOverridden` - State tracking
- `overrideReason, overriddenBy, overriddenAt` - Override audit trail

**BP_PF_v7pp_scoring_versions:**
- `aggregationMethod: VARCHAR(50)` - Default aggregation method
- `weightMode: VARCHAR(50)` - Default weight mode
- `scoreScale: VARCHAR(50)` - Default score scale

## Verification

### Quick Check (in Supabase SQL Editor)

```sql
-- Check configuration tables
SELECT COUNT(*) as total FROM "BP_PF_v7pp_answer_types";
-- Expected: 6

SELECT COUNT(*) as total FROM "BP_PF_v7pp_aggregation_methods";
-- Expected: 6

SELECT COUNT(*) as total FROM "BP_PF_v7pp_rating_scales";
-- Expected: 10

-- Check new columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'BP_PF_v7pp_scoring_nodes'
AND column_name IN ('scoreLeafDepth', 'isScoringLeaf');
-- Expected: 2 rows
```

### API Verification

After script runs and Next.js app starts:

```bash
# Test configuration API
curl http://localhost:3000/api/admin/scoring/configuration?type=answerTypes

# Expected response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "OPTION_SINGLE",
#       "label": "Option unique",
#       "requiresOptions": true,
#       ...
#     },
#     ...
#   ]
# }
```

## Troubleshooting

### Issue: "role does not have CONNECT privilege"
**Solution:** Ensure your Supabase JWT token has full database access or use SERVICE ROLE key

### Issue: "permission denied for schema public"
**Solution:** Verify you're using a database role with USAGE privileges on public schema

### Issue: "table already exists"
**Solution:** This shouldn't happen - script uses `CREATE TABLE IF NOT EXISTS`. If you get this error, check for a broken transaction and run script again.

### Issue: Foreign key constraint fails
**Solution:** Ensure BP_PF_v7pp_scoring_nodes table exists before running this script. The script should create it or use Prisma migrations first.

### Issue: Script runs but verification queries show 0 rows
**Solution:** 
1. Check for errors in SQL execution panel
2. Verify no transactions are in progress (`ROLLBACK` to reset)
3. Check table names have correct quotes: `"BP_PF_v7pp_..."`

## Next Steps After Deployment

1. **Start Next.js Application**
   ```bash
   npm run dev
   ```

2. **Access Admin Builder**
   - Navigate to `http://localhost:3000/app/admin/scoring/builder`
   - You should see configuration dropdowns populated with database values

3. **Verify Configuration Dropdowns**
   - Model Configuration Panel should show:
     - Aggregation Method dropdown (6 options)
     - Weight Mode dropdown (3 options)
     - Score Scale dropdown (4 options)

4. **Create Scoring Model**
   - Use the admin builder to create a new scoring model
   - Select answer types, aggregation methods from dropdowns
   - All configuration now comes from database

5. **Configure Data Bindings**
   - Optional: Set up data bindings for auto-fill
   - Define source entities (BUDGET_LINE, FINANCIAL_DATA, etc.)
   - Configure data transformations

## Production Deployment Checklist

- [ ] Run SUPABASE_COMPLETE_SETUP.sql on production database
- [ ] Verify all configuration tables have data
- [ ] Test configuration API endpoints
- [ ] Deploy Next.js app with matching Prisma schema
- [ ] Access admin builder and verify dropdowns populated
- [ ] Create test scoring model with database configuration
- [ ] Run evaluation and verify results
- [ ] Test data binding auto-fill (if configured)
- [ ] Check audit trail for answer tracking

## Performance Considerations

The script creates indexes on:
- Configuration tables: `isActive` indexes for filtering
- Data bindings: `nodeId`, `sourceEntity`, `isActive`, `priority`
- Evaluation answers: `sourceBindingId`, `isAutoFilled`, `isOverridden`
- Scoring nodes: `isScoringLeaf` with version filter

These indexes optimize:
- Configuration queries (fast dropdown population)
- Data binding lookups (fast auto-fill)
- Audit trail searches (fast compliance reports)

## Rollback Procedure

If you need to rollback, this script can be safely re-run multiple times. To start fresh:

1. Drop configuration data (NOT tables, to preserve structure):
   ```sql
   DELETE FROM "BP_PF_v7pp_answer_types";
   DELETE FROM "BP_PF_v7pp_aggregation_methods";
   DELETE FROM "BP_PF_v7pp_weight_modes";
   DELETE FROM "BP_PF_v7pp_score_scales";
   DELETE FROM "BP_PF_v7pp_rating_scales";
   ```

2. Re-run SUPABASE_COMPLETE_SETUP.sql to restore default data

3. Or drop entire tables and Prisma will recreate on next `prisma migrate deploy`

## Support

- Supabase documentation: https://supabase.com/docs
- PostgreSQL documentation: https://www.postgresql.org/docs/
- PF Scoring documentation: See README.md in project root

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-18 | Initial complete setup script with all parameterization, data binding, and flexible scoring |

---

**Generated:** 2026-04-18  
**Compatibility:** PostgreSQL 12+, Supabase (PostgreSQL 15+)  
**Status:** Production Ready ✅
