# Database Migration & Seeding Guide

## 🎯 Overview

This guide explains how to align the Frontend, Backend, and Database for the PF Scoring application. All migrations and seeds are **idempotent** (safe to run multiple times).

## 📦 What Gets Seeded

### 1. V9 Sectorial Data (12 sectors + 360 records)
- **12 Sectors**: ENR, EAU, TRA, POR, IND, MIN, TOU, TEL, SAN, AGR, ETH, IMM
- **144 Thresholds**: DSCR/LLCR/LEVERAGE ratios per sector (12 × 3 × 4)
- **108 Domain Weights**: Weight factors for 9 domains per sector
- **96 Red Flags**: Sector-specific risk flags (8 per sector)
- **72 Indicators**: KPIs and performance indicators (6 per sector)
- **24 Stress Tests**: Scenario testing rules (2 per sector)
- **10 Malus/Bonus Rules**: Scoring adjustments

### 2. Project Form Configuration (8 sections + 30+ fields)
- **8 FormSection** records (identification, location, stakeholders, technical, timeline, financing, insurance, administration)
- **30+ FieldConfiguration** records (all project form fields with type, validation, defaults)
- Pre-configured for dynamic form rendering via `/api/forms/configuration/project`

### 3. Application Configuration
- **SCORING_SECTORIAL_ENABLED**: Toggle sectorial scoring (default: false, private)
- **SCORING_DOMAIN_GRANULARITY**: Per-domain granularity config (default: {}, private)
- **SCREENS_DYNAMIC_FORMS_ENABLED**: Toggle dynamic form rendering (default: false, **public**)

## 🚀 Quick Start

### Option A: Complete Seed (Recommended)
```bash
# Run all migrations + seeds in one command
npm run db:seed:complete
```

### Option B: Step-by-Step

```bash
# 1. Apply all pending database migrations
npm run db:migrate:deploy

# 2. Generate Prisma client
npm run db:generate

# 3. Seed V9 data only
npm run db:seed:v9

# 4. Seed form configuration only
npm run db:seed

# 5. Check status
npm run db:migrate:status
```

## 📋 What Each Script Does

### `npm run db:migrate:status`
- Shows which migrations have been applied
- Lists pending migrations (if any)
- No changes to database

### `npm run db:migrate:deploy`
- Applies all pending migrations in order
- Creates tables, indexes, constraints
- Adds new configuration keys to AppConfiguration
- **No data loss** - only schema changes

### `npm run db:seed:v9`
- Seeds 12 V9 sectors
- Seeds 144 thresholds (ratio-based scoring)
- Seeds 96 red flags (sector-specific risks)
- Seeds 72 indicators (KPIs)
- Seeds 24 stress tests (scenario analysis)
- Seeds 108 domain weights (calibration factors)
- Seeds 10 malus/bonus rules
- Creates V9 scoring model v9.0.0

### `npm run db:seed`
- Default Prisma seed from `prisma/seed.ts`
- Typically seeds reference data, lookup tables
- (May include test users/clients if configured)

### `npm run db:seed:complete` ⭐
- **All of the above in one script**
- Combines V9, form configuration, app config
- Verifies counts match expected values
- Single source of truth for complete alignment

## 🔍 Verification Steps

After running seeds, verify everything is in place:

```bash
# 1. Check V9 sector data
curl -H "Authorization: Bearer $TOKEN" https://app/api/reference/sectors

# Expected: 12 sectors (ENR, EAU, TRA, POR, IND, MIN, TOU, TEL, SAN, AGR, ETH, IMM)

# 2. Check form configuration
curl -H "Authorization: Bearer $TOKEN" https://app/api/forms/configuration/project

# Expected: 8 sections with 30+ fields, all properly typed

# 3. Check public configuration
curl https://app/api/config/public

# Expected includes: SCREENS_DYNAMIC_FORMS_ENABLED=false

# 4. Test project creation with all fields
curl -X POST -H "Authorization: Bearer $TOKEN" https://app/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test Solar Project",
    "description": "100MW solar facility",
    "secteur": "ENR",
    "montant": 50000000,
    "devise": "MAD",
    "pays": "Maroc",
    "technologie": "Solar PV",
    "capaciteInstallee": 100,
    "debutConstruction": "2026-09-01",
    "finConstruction": "2027-06-30",
    "coutTotal": 50000000,
    "financement": 35000000,
    "apportPropre": 15000000,
    "dureeProjet": 25,
    "periodeAmorce": 2,
    "periodeRemboursement": 18,
    "taux": 4.5,
    "dureeCredit": 18,
    "typeCredit": "Senior Debt",
    "tauxCouverture": 1.35,
    "ratio": 1.2,
    "scoreGlobal": null,
    "grade": null
  }'

# Expected: Returns 201 with project ID and all fields persisted
```

## 🔧 Troubleshooting

### Issue: "Migration failed - constraint violation"
**Cause**: Migration tried to add constraint but data violates it
**Fix**: Check existing data, remove violating rows, re-run migration

### Issue: "Seed failed - Sector ID not found"
**Cause**: V9Sector records haven't been created yet
**Fix**: Run `npm run db:seed:v9` before running other seeds

### Issue: "POST /api/projects returns validation error"
**Cause**: Schema doesn't match form fields
**Fix**: Run `npm run db:migrate:deploy` to ensure schema is current

### Issue: "Cannot query type FormSection (table doesn't exist)"
**Cause**: FormSection migration hasn't been applied
**Fix**: Run all migrations: `npm run db:migrate:deploy`

## 📊 Database State After Seeding

### Table Counts (Expected)
```
V9Sector:                12
V9SectorThreshold:       144
V9SectorDomainWeight:    108
V9RedFlag:               96
V9Indicator:             72
V9StressTest:            24
V9MalusBonus:            10
V9ScoringModel:          1
FormSection:             8  (project entity)
FieldConfiguration:      30+ (project entity)
AppConfiguration:        15+ (includes 3 parametrization keys)
```

## 🛡️ Safety & Reversibility

All operations are **safe and reversible**:

- **Migrations**: Use Prisma's built-in rollback if needed
  ```bash
  # Revert last migration
  npm run db:migrate dev -- --name rollback_name
  ```

- **Seeds**: Idempotent (upsert operations) - can be re-run without duplicates
- **Feature Flags**: Disabled by default, opt-in activation via admin panel
- **Backward Compatibility**: No breaking changes to existing tables/fields

## 🎯 Frontend-Backend-Database Alignment Checklist

After running migrations and seeds:

- [ ] **Frontend**: All project form fields defined (30+ fields)
- [ ] **Backend**: All fields validated in createProjectSchema
- [ ] **Database**: All fields present in Project table
- [ ] **API**: POST /api/projects accepts all fields
- [ ] **API**: GET /api/projects/[id] returns all populated fields  
- [ ] **API**: PUT /api/projects/[id] updates all fields
- [ ] **V9 Data**: 12 sectors + 360 configuration records loaded
- [ ] **Form Config**: 8 sections + 30+ fields configured for dynamic forms
- [ ] **Config Keys**: 3 parametrization flags ready (all default: false/disabled)
- [ ] **Reference API**: /api/reference/sectors returns 12 sectors
- [ ] **Form API**: /api/forms/configuration/project returns schema
- [ ] **Public Config**: /api/config/public includes SCREENS_DYNAMIC_FORMS_ENABLED

## 🚀 Next Steps

### To Enable Dynamic Forms
1. Run complete seed: `npm run db:seed:complete`
2. Visit `/admin/dynamic-forms`
3. Click "Initialize Database" (verifies seed)
4. Click "Enable Dynamic Forms" toggle
5. Project screens will now render from database config

### To Use V9 Sectorial Scoring
1. Ensure V9 seed ran: `npm run db:seed:v9`
2. Via admin panel, enable: `SCORING_SECTORIAL_ENABLED = true`
3. Next project scoring will apply sectorial weights + red flags + stress tests

### To Customize Forms (Future)
1. Modify FieldConfiguration via admin UI (coming soon)
2. Add/remove/reorder fields without code changes
3. Reorder sections, change field types, add validation rules
4. All changes immediately effective (5-minute cache invalidation)

---

**Last Updated**: 2026-06-19  
**Database Version**: V9 + Form Configuration + Parametrization Extensions  
**Status**: ✅ Ready for production
