# Frontend-Backend-Database Alignment Analysis

## 📊 Current System State

### Database Schema (73 Models)
- **Core**: User, Client, Project, Scoring, Evaluation
- **V7++ Legacy**: Scoring*, ScoreDomain, ScoreCriterion, ScoreOption, ScoreRange
- **V8 Integration**: V8IntegrationRule, V8Sector, V8SectorDomainWeight, V8SectorRedFlag, V8SectorStressTest
- **V9 Sectorial**: V9Sector (12 sectors), V9SectorDomainWeight (108), V9SectorThreshold (144), V9RedFlag (96), V9Indicator (72), V9StressTest (24), V9MalusBonus, V9AntiDoubleCount
- **Governance & Workflow**: ScoringModel, ScoringModelVersion, ScoringDecision, ScoringWorkflow, ScoringApproval
- **Form Configuration**: FormSection, FieldConfiguration, FormPreset
- **App Config**: AppConfiguration, AppConfigHistory, SystemConfig

### Frontend: Project Fields (All Present ✓)
- Basic: nom, description, secteur, montant, devise, status, countryCode, pays
- Stakeholders: sponsorPrincipal, nomSPV, constructeurEPC, operateurOM
- Technical: technologie, capaciteInstallee, dureeProjet, periodeAmorce, periodeRemboursement
- Financial: coutTotal, financement, apportPropre, dureeCredit, taux, typeCredit, tauxCouverture, ratio
- Timeline: debutConstruction, finConstruction
- Structural: structureCapitalePrincipale
- Scoring: scoreGlobal, grade

### Backend: Validation & API (All Fields Validated ✓)
- createProjectSchema: All fields defined + handled
- ProjectService.createProject(): Properly maps & creates
- ProjectService.updateProject(): Full support
- Endpoints: POST /api/projects, GET /api/projects, PUT /api/projects/[id]

### Database: Project Table Schema (All Fields Present ✓)
```
✓ nom, description, secteur, montant, devise, status, countryCode, pays
✓ sponsorPrincipal, nomSPV, constructeurEPC, operateurOM
✓ technologie, capaciteInstallee, dureeProjet, periodeAmorce, periodeRemboursement
✓ debutConstruction (DateTime), finConstruction (DateTime)
✓ coutTotal, financement, apportPropre, dureeCredit, taux, typeCredit
✓ tauxCouverture, ratio, structureCapitalePrincipale
✓ scoreGlobal, grade
✓ Relationships: user (creePar), client (clientId), scorings, evaluations, scoringEvaluations
```

## 🔧 Alignment Gaps & Fixes Required

### 1. FormSection Table - Missing `layout` Field
**Status**: ❌ Schema has `layout` but FieldConfiguration rendering expects structure
**Fix**: None needed - migration already adds layout field (default 'accordion')

### 2. Dynamic Forms Configuration
**Status**: ⚠️ Requires DB initialization
**Requirements**:
- FormSection records for 'project' entity (8 sections from lib/field-config.ts)
- FieldConfiguration records for all project fields
- Must be seeded before SCREENS_DYNAMIC_FORMS_ENABLED can be activated

**Data to Seed**:
```
Sections (8):
  1. identification (Briefcase)
  2. location (MapPin)
  3. stakeholders (Users)
  4. technical (Zap)
  5. timeline (Calendar)
  6. financing (DollarSign)
  7. insurance (Shield)
  8. administration (Settings)

Fields per section: 30+ total from lib/field-config.ts
```

### 3. V9 Sector Seeding
**Status**: ⚠️ Requires execution
**Data**: 12 sectors + 360 related records (thresholds, weights, red flags, indicators, stress tests, malus/bonus)
**Source**: prisma/migrations/v9_source_data.json
**Script**: `npm run db:seed:v9`

### 4. Public AppConfiguration
**Status**: ⚠️ Not marked as public
**Fix**: Update AppConfiguration records to set `isPublic=true` for client-facing flags
```
isPublic=true:
  - SCREENS_DYNAMIC_FORMS_ENABLED (bool)
  - (any other client-side feature flags)

isPublic=false (default):
  - SCORING_SECTORIAL_ENABLED
  - SCORING_DOMAIN_GRANULARITY
  - (internal/admin config)
```

### 5. Field Defaults & Type Mismatches
**Status**: ✓ All properly handled
- Datetime fields: debutConstruction, finConstruction (strings from form → parsed to Date in service)
- Numeric fields: montant, capaciteInstallee, etc. (numberOrString schema handles both)
- Enums: status mapped to ProjectStatus enum

## 📋 Migration Plan

### Phase 1: Verify Database Migrations
- Confirm all 28 migrations applied
- Verify FormSection & FieldConfiguration tables exist
- Check AppConfiguration schema (includes isPublic field)

### Phase 2: Seed Master Data
1. Run V9 seed: `npm run db:seed:v9` (12 sectors + 360 records)
2. Run form configuration seed: `npm run db:seed` (if includes FormSection/FieldConfiguration)
3. Verify counts match expected:
   - V9Sector: 12 ✓
   - V9SectorThreshold: 144 ✓
   - V9SectorDomainWeight: 108 ✓
   - V9RedFlag: 96 ✓
   - V9Indicator: 72 ✓
   - V9StressTest: 24 ✓
   - FormSection (project): 8 ✓
   - FieldConfiguration (project): 30+ ✓

### Phase 3: Configuration Alignment
1. Update SCREENS_DYNAMIC_FORMS_ENABLED: `isPublic=true`
2. Verify all three parametrization keys exist in AppConfiguration:
   - SCORING_SECTORIAL_ENABLED
   - SCORING_DOMAIN_GRANULARITY
   - SCREENS_DYNAMIC_FORMS_ENABLED
3. Cache TTL: 5 minutes (invalidates on update)

### Phase 4: Frontend-Backend Validation
1. POST /api/projects: Can create with all fields
2. GET /api/projects/[id]: Returns all populated fields
3. PUT /api/projects/[id]: Can update with all fields
4. Dynamic forms: Can fetch /api/forms/configuration/project
5. Reference sectors: Can fetch /api/reference/sectors

## ✅ Post-Alignment Verification

```bash
# 1. Verify migrations
npm run db:migrate:status

# 2. Seed data
npm run db:seed:v9
npm run db:seed

# 3. Test API endpoints
curl -H "Authorization: Bearer $TOKEN" https://app/api/reference/sectors
curl -H "Authorization: Bearer $TOKEN" https://app/api/forms/configuration/project
curl -H "Authorization: Bearer $TOKEN" https://app/api/config/public

# 4. Create test project (validate all fields persist)
curl -X POST -H "Authorization: Bearer $TOKEN" https://app/api/projects \
  -d '{
    "nom": "Test Project",
    "secteur": "ENR",
    "montant": 1000000,
    "debutConstruction": "2026-06-19",
    "technologie": "Solar PV",
    "capaciteInstallee": 100,
    ...
  }'
```

## 🎯 Expected Outcome

1. ✓ Frontend forms submit all 30+ project fields
2. ✓ Backend validates and persists all fields  
3. ✓ Database stores with proper types & relationships
4. ✓ V9 sectorial data available for scoring engine
5. ✓ Dynamic forms can be enabled via toggle
6. ✓ Form configuration editable from admin panel
7. ✓ No data loss, backward compatible, opt-in toggles
