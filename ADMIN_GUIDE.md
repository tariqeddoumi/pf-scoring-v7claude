# PF Scoring - Admin Guide

## Overview

This guide covers all administrator features and configurations available in the PF Scoring application. The admin panel is accessible to users with `system_admin` role and provides comprehensive control over forms, scoring models, and system configuration.

**Access**: `/admin`  
**Required Role**: `system_admin`  
**Last Updated**: 2026-06-19

---

## Admin Dashboard

The main admin dashboard (`/admin`) provides quick access to all administrative functions organized by category.

### Dashboard Sections

#### Core Configuration (Priority ★)

**1. Paramétrage de l'outil** (`/admin/configuration`)
- Configure application name, logo, colors, fonts, and theme
- Changes apply immediately across the entire application
- Settings stored in `AppConfiguration` table
- Role: `system_admin`

**2. Granularité du Scoring** (`/admin/scoring/granularity`)
- Configure scoring depth per domain: DOMAIN → CRITERION → SUB_CRITERION
- Allows different precision levels per financial/technical/market domain
- Example: Financial domain at CRITERION level, Technical at SUB_CRITERION
- Updates `SCORING_DOMAIN_GRANULARITY` configuration key
- Role: `system_admin`

**3. Formulaires Dynamiques** (`/admin/dynamic-forms`)
- Enable/disable dynamic form rendering (feature toggle: `SCREENS_DYNAMIC_FORMS_ENABLED`)
- Initialize field configurations from code into database
- Two-phase setup: Initialize → Enable
- Role: `system_admin`

**4. Gestion des Champs de Formulaire** (`/admin/field-management`)
- Customize form fields, sections, and options
- Reorder fields and sections (drag-drop or arrows)
- Show/hide fields without code changes
- Edit field properties (label, placeholder, validation, help text)
- Add custom options for select fields
- Role: `system_admin`

#### Scoring Configuration

**5. Modèle de Scoring PF V7++** (`/admin/scoring`)
- View active scoring model structure
- Display 9 domains with criteria and subcriteria
- Show scoring bands and grade distribution
- Read-only visualization
- Role: `system_admin`

**6. Paramétrage Grille V7++** (`/admin/scoring-grid-v7pp`)
- Full hierarchical editor for scoring grid
- Add/edit/delete domains, criteria, subcriteria
- Configure numeric ranges and scoring bands
- Edit option labels and values
- Role: `system_admin`

**7. Grille de Scoring (legacy)** (`/admin/scoring-grid`)
- Manage flat (non-hierarchical) scoring criteria
- Legacy interface, kept for backward compatibility
- Role: `system_admin`

#### Reference Data

**8. Risque Pays** (`/admin/country-risk`)
- Configure country risk scores
- Affects country risk scoring in evaluations
- Supports global risk adjustments
- Role: `system_admin`

#### System Administration

**9. Authentification** (`/admin/auth-settings`)
- Configure authentication methods
- Set authentication policies and requirements
- Manage session timeouts
- Role: `system_admin`

**10. Paramètres Système** (`/admin/system-settings`)
- General application settings
- Database connectivity settings
- System maintenance options
- Role: `system_admin`

**11. Diagnostic Système** (`/admin/diagnostic`)
- System health checks
- Configuration verification
- Database connectivity tests
- Role: `system_admin`

**12. Gestion des Utilisateurs** (`/admin/users`)
- Create/edit/delete users
- Assign roles and permissions
- Manage user access levels
- Role: `system_admin`

**13. Journal d'Audit** (`/admin/audit-logs`)
- View complete modification history
- Track user actions and changes
- Filter and search audit events
- Role: `risk_manager`

---

## Feature: Dynamic Forms

### What Are Dynamic Forms?

Dynamic forms are rendered from database configuration (`FormSection` + `FieldConfiguration` tables) instead of hardcoded React components. This enables non-developers to customize forms without code changes.

### How It Works

```
lib/field-config.ts (code) 
    ↓ [seed-complete.ts imports and seeds]
FormSection + FieldConfiguration (database)
    ↓ [/api/forms/configuration/[entity]]
DynamicEntityForm (React component)
    ↓ [renders UI]
Project/Client form (web interface)
```

### Setup Process

**Step 1: Enable Dynamic Forms Feature**

Navigate to `/admin/dynamic-forms`

1. Review the feature toggle card (currently "Disabled")
2. Click "Initialize Database" button
   - Reads `lib/field-config.ts` (PROJECT_SECTIONS, CLIENT_SECTIONS)
   - Creates FormSection records (6 project sections)
   - Creates FieldConfiguration records (28 project fields)
   - Skips if already initialized
3. Verify success message: "Database initialized successfully"

**Step 2: Activate Feature Toggle**

1. Click "Enable Dynamic Forms" button
2. Application reloads after 1.5 seconds
3. Project forms now render from database configuration

**Step 3: Verify Implementation**

1. Navigate to `/projects/new`
2. Should render 6 sections with 28 fields from database
3. Fill and save a project
4. All 28 fields should persist to database

### Fallback Behavior

If `SCREENS_DYNAMIC_FORMS_ENABLED` is enabled but configuration is missing:
- Component checks `/api/forms/configuration/project`
- If config missing, falls back to hardcoded Tabs component
- Non-breaking: existing functionality preserved

### Disabling Dynamic Forms

1. Navigate to `/admin/dynamic-forms`
2. Click "Disable Dynamic Forms" button
3. Application reverts to hardcoded forms
4. Database configuration remains intact (can be re-enabled)

---

## Feature: Field Management

### What Can You Do?

Field management allows you to:
- **View all fields** for an entity (client, project, evaluation, user)
- **Reorder fields and sections** without code changes
- **Show/hide fields** to customize which fields display in forms
- **Edit field properties**:
  - Label (display name)
  - Placeholder (hint text)
  - Help text (additional guidance)
  - Field type (text, email, number, select, date, etc.)
  - Required/optional status
  - Validation rules
  - Custom options (for select fields)
- **Add new fields** (if they exist in the schema)
- **Delete fields** (if they're not required for data integrity)

### How to Access

1. Navigate to `/admin/field-management`
2. Select entity from dropdown: "Clients", "Projets", "Évaluations", or "Utilisateurs"
3. View sections and fields for that entity

### Reordering Fields

**Via Drag-Drop** (if implemented):
- Hover over field
- Drag to new position
- Changes save automatically

**Via Arrows**:
- Click "Move Up" (↑) or "Move Down" (↓) button
- Field moves within section
- Changes save immediately

### Editing Field Properties

1. Click "Edit" (✏️) icon on field
2. Form appears with editable properties:
   - **Label**: Display name in form
   - **Placeholder**: Hint text in input
   - **Help Text**: Longer explanation below field
   - **Field Type**: Select from text/email/tel/number/date/select/textarea/checkbox/radio
   - **Required**: Toggle to mark field as required
   - **Validation**: Custom regex or validation rule
3. Click "Save" button
4. Field updates immediately in live forms

### Adding Custom Options (Select Fields)

For fields with type "select" or "radio":

1. Edit the field
2. In "Options" section, click "Add Option"
3. Enter:
   - **Label**: What users see (e.g., "Énergies renouvelables")
   - **Value**: Internal value (e.g., "ENR")
4. Add more options as needed
5. Click "Save"
6. Form immediately shows new options

### Hiding/Showing Fields

1. View field in management interface
2. Toggle "Visibility" icon (👁️ for visible, 👁️‍🗨️ for hidden)
3. Hidden fields:
   - Do NOT appear in forms
   - Data not collected
   - Existing data still in database

### Adding New Fields (Advanced)

If a new field is added to the schema and field-config.ts:

1. Run seed script: `npm run db:seed:complete`
2. New field appears in field management interface
3. Configure and enable as needed

### Important Notes

⚠️ **Field Name Mismatch Warning**

If you add a field in field management but the name doesn't exist in:
- `prisma/schema.prisma` (Project model)
- `lib/validations.ts` (createProjectSchema)

Then data entered in the form will be silently lost when saved. Always verify field names match the schema before adding new fields.

✅ **Verification**

To verify field alignment:
```bash
npm run db:seed:complete
# Should complete with:
# ✓ fieldConfigs: 28/28 (for projects)
# All counts at expected values
```

---

## Feature: Scoring Configuration

### Modèle V9 Sectorial Scoring

The application supports advanced V9 sectorial scoring with 12 industry sectors, domain weights, red flags, stress tests, and malus/bonus rules.

### How to Enable

**Via API** (recommended for automation):
```sql
UPDATE app_configuration 
SET value = 'true' 
WHERE key = 'SCORING_SECTORIAL_ENABLED';
```

**Via Admin UI** (coming soon):
- Navigate to `/admin/scoring`
- Toggle "Enable V9 Sectorial Scoring"

### What Gets Applied

When `SCORING_SECTORIAL_ENABLED = true`:

1. **Domain Weights** (by sector)
   - Each of 9 domains gets a weight per sector
   - Example: Financial domain weighted 35% for renewable energy, 20% for telecom
   - Total weight = 108 records (12 sectors × 9 domains)

2. **Red Flags** (trigger score cap)
   - 96 red flags total (12 sectors × 8 red flags each)
   - When triggered: final score capped at maximum allowed level
   - Example: "Sponsor has historical project failure" → score cap reduced to B

3. **Stress Tests** (DSCR sensitivity)
   - 24 stress tests (12 sectors × 2 tests each)
   - Simulate market stress scenarios
   - Adjust DSCR requirements for approval

4. **Malus/Bonus** (adjustment rules)
   - 10 rules applied after scoring
   - Malus: -5% to -20% adjustment for risk factors
   - Bonus: +5% to +10% for positive factors
   - Example: Bonus for female-owned enterprises (+10%)

### V9 Sectors Supported

| Code | Sector | Example Projects |
|------|--------|------------------|
| ENR | Énergies renouvelables | Solar, Wind, Hydro |
| EAU | Eau / Dessalement | Water treatment, Desalination |
| TRA | Transport / Autoroutes | Highways, Railways, Bridges |
| POR | Ports / Logistique | Seaports, Dry ports, Terminals |
| IND | Industrie / Manufacturing | Textiles, Chemicals, Steel |
| MIN | Mines / Extraction | Phosphates, Copper, Gold |
| TOU | Tourisme / Hôtellerie | Hotels, Resorts, Attractions |
| TEL | Télécom / Data Centers | Telecom networks, Data centers |
| SAN | Santé / Cliniques | Hospitals, Clinics, Diagnostics |
| AGR | Agro-industrie | Food processing, Agriculture |
| ETH | Énergie thermique / Gaz | Gas pipelines, Thermal power |
| IMM | Immobilier / Promotion structurée | Commercial real estate, Housing |

### Granularity Configuration

Control scoring depth per domain independently:

```json
{
  "DOMAIN_FINANCIAL": "DOMAIN",           // Score at domain level only
  "DOMAIN_TECHNICAL": "CRITERION",        // Score by criterion
  "DOMAIN_MARKET": "SUB_CRITERION"        // Score at finest level
}
```

**Levels**:
- `DOMAIN`: Single score for entire domain
- `CRITERION`: Score each criterion (e.g., Liquidity, Solvency, Profitability)
- `SUB_CRITERION`: Score each subcriteria (e.g., Current Ratio, Quick Ratio)

**Impact**:
- Finer granularity = more precise but more time-consuming scoring
- Coarser granularity = faster scoring but less detailed analysis

---

## Application Configuration Keys

All configuration managed in `AppConfiguration` table:

### Scoring Keys

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `SCORING_SECTORIAL_ENABLED` | bool | false | Enable V9 sectorial scoring |
| `SCORING_DOMAIN_GRANULARITY` | json | {} | Granularity level per domain |

### Form Keys

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `SCREENS_DYNAMIC_FORMS_ENABLED` | bool | false | Enable dynamic form rendering |

### System Keys

| Key | Type | Default | Purpose |
|-----|------|---------|---------|
| `APP_NAME` | string | "PF Scoring" | Application display name |
| `APP_LOGO_URL` | string | null | Application logo URL |
| `APP_THEME` | string | "dark" | UI theme (light/dark) |

---

## Deployment Workflow

### Pre-Production Checklist

1. **Test Field Alignment**
   ```bash
   npm run db:seed:complete
   # Verify: ✓ fieldConfigs: 28/28
   ```

2. **Test Dynamic Forms**
   - Navigate to `/admin/dynamic-forms`
   - Click "Initialize Database"
   - Click "Enable Dynamic Forms"
   - Go to `/projects/new`
   - Verify form renders with 6 sections, 28 fields
   - Create test project
   - Verify all 28 fields persist to database

3. **Test Field Management**
   - Navigate to `/admin/field-management`
   - Select "Projets" entity
   - Verify 6 sections displayed with 28 fields
   - Test reordering: move a field up/down
   - Test visibility toggle: hide a field
   - Go to `/projects/new`
   - Verify hidden field not displayed

4. **Test Sectorial Scoring** (if enabling)
   - Create test project with sector = ENR
   - Create evaluation for project
   - Score all domains
   - Verify scoring reflects ENR sector weights
   - Check red flags and stress tests applied

### Production Deployment

1. **Backup database** before running migrations
2. **Run migrations**:
   ```bash
   npm run db:migrate:deploy
   ```
3. **Run seed**:
   ```bash
   npm run db:seed:complete
   # Verify all counts correct
   ```
4. **Enable features gradually**:
   - Week 1: Dynamic forms (SCREENS_DYNAMIC_FORMS_ENABLED = true)
   - Week 2: Sectorial scoring (SCORING_SECTORIAL_ENABLED = true)
   - Week 3: Granularity (SCORING_DOMAIN_GRANULARITY = custom config)
5. **Monitor logs** for errors or unexpected behavior
6. **Conduct user acceptance testing** before full production launch

---

## Troubleshooting

### "Field not saving" Issue

**Symptom**: Edit a field, click save, but change doesn't persist

**Causes & Fixes**:
1. Field name doesn't exist in schema → Add to schema first
2. API endpoint not available → Check `/api/admin/field-configurations/[id]`
3. Permission issue → Verify user has `system_admin` role
4. Network error → Check browser console for error details

### "Form not rendering dynamically"

**Symptom**: Enable toggle but forms still show hardcoded version

**Causes & Fixes**:
1. Database not initialized → Run "Initialize Database" button
2. Flag not actually enabled → Verify in database: `SELECT * FROM app_configuration WHERE key = 'SCREENS_DYNAMIC_FORMS_ENABLED'`
3. Browser cache → Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Form fallback triggered → Check browser console for `/api/forms/configuration/project` errors

### "Missing field in dynamic form"

**Symptom**: Field appears in hardcoded form but not in dynamic form

**Causes & Fixes**:
1. Not seeded → Run `npm run db:seed:complete`
2. Field visible=false → Check field management, toggle visibility
3. Field name typo → Verify exact name in field-config.ts vs schema

### "Sectorial scoring not applied"

**Symptom**: Enable V9 but scoring doesn't reflect sector weights

**Causes & Fixes**:
1. Flag not actually enabled → Check: `SELECT value FROM app_configuration WHERE key = 'SCORING_SECTORIAL_ENABLED'`
2. V9 data not seeded → Run `npm run db:seed:complete`
3. Project sector not set → Ensure project.secteur field has value
4. Sector code mismatch → Verify sector code matches V9_SECTORS (ENR, EAU, etc.)

---

## Best Practices

### Field Management

✅ DO:
- Verify new fields exist in schema before adding
- Use consistent naming (camelCase for field names)
- Provide helpful placeholder and help text
- Test changes on non-production environment first
- Document any custom validation rules

❌ DON'T:
- Change field names in field management (breaks data mapping)
- Delete fields that have existing data (data loss)
- Add fields with names not in schema (silent data loss)
- Use special characters in field names
- Remove required fields without updating validation

### Scoring Configuration

✅ DO:
- Enable features in order: forms → sectorial → granularity
- Test each feature independently before combining
- Document any custom granularity configurations
- Monitor scoring outputs after enabling new features
- Create backup before major configuration changes

❌ DON'T:
- Enable all features at once (hard to debug if issues arise)
- Change domain weights without understanding impact
- Remove red flags without understanding risk implications
- Change granularity mid-evaluation (inconsistent results)

### Access Control

✅ DO:
- Restrict admin access to trusted users only
- Use `system_admin` role for configuration changes
- Use `risk_manager` role for audit review only
- Log all configuration changes (automatic)
- Review audit logs regularly

❌ DON'T:
- Share admin credentials
- Grant admin access to users who don't need it
- Bypass authentication checks
- Make emergency changes without logging

---

## API Reference

### Field Configuration Endpoints

**GET** `/api/admin/field-configurations?entity=project&type=sections`
- List all form sections for entity
- Returns FormSection[] with nested FieldConfiguration[]

**GET** `/api/admin/field-configurations?entity=project&type=fields`
- List all fields for entity
- Returns FieldConfiguration[]

**POST** `/api/admin/field-configurations`
```json
{
  "type": "section" | "field",
  "entity": "project" | "client" | "evaluation" | "user",
  "title": "Section Title",           // for sections
  "fieldName": "fieldName",           // for fields
  "label": "Display Label",
  "fieldType": "text" | "select" | "number",
  "required": true | false,
  "customOptions": [                  // for select fields
    { "label": "Option 1", "value": "opt1" }
  ]
}
```

**PUT** `/api/admin/field-configurations/[id]`
- Update field or section properties
- Request body same as POST

**DELETE** `/api/admin/field-configurations/[id]`
- Delete field or section (careful: no undo)

### Configuration Endpoints

**GET** `/api/config/public`
- Public configuration flags (SCREENS_DYNAMIC_FORMS_ENABLED, etc.)
- Returns public-safe configuration only

**PUT** `/api/admin/configuration/[key]`
```json
{
  "value": "true" | "false" | "{ ... }"
}
```
- Update configuration key
- Requires `system_admin` role

---

## Support & Documentation

For more detailed information:
- **Field Alignment**: See `ALIGNMENT_ANALYSIS.md`
- **Seeding & Migration**: See `SEEDING_DEPLOYMENT.md`
- **Migration Guide**: See `MIGRATION_GUIDE.md`
- **Deployment Checklist**: See `DEPLOYMENT_CHECKLIST.md`

---

**Last Updated**: 2026-06-19  
**Version**: 1.0  
**Maintained By**: Development Team
