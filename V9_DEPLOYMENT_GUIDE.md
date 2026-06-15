# V9 Deployment Guide

## Overview

V9 is a complete scoring model redesign with:
- **Socle (foundation)**: V7++ unchanged (9 domains, 28 criteria, 84 sub-criteria, 336 options)
- **Sectorial layers**: 12 Project Finance sectors with differentiated thresholds, red flags, indicators, stress tests
- **Parametrization**: Full app configuration (name, colors, fonts, theme)
- **Architecture**: Additive to V8, fully backward compatible (non-breaking)

---

## Phase 1: Database Migration & Seed

### Prerequisites
- Supabase project with PostgreSQL database
- `DATABASE_URL` environment variable configured
- Prisma CLI installed (`npm install -g prisma`)

### Step 1: Apply Migration

```bash
# View pending migrations
npx prisma migrate status

# Apply all pending migrations
npx prisma migrate deploy

# Alternative: For Vercel deployment, use:
# Migrations are applied via Supabase dashboard directly
```

**Migration Details:**
- File: `prisma/migrations/20260613000000_add_v9_tables/migration.sql`
- Creates 9 new tables (11 models in Prisma)
- Enables RLS on critical tables
- Creates materialized view for data integrity checks
- **Idempotent**: Safe to run multiple times

### Step 2: Seed Database with V9 Data

```bash
# Run seed script (TypeScript)
npm run db:seed:v9

# Or via npx:
npm run db:seed:v9

# Expected output:
# 🌱 Starting V9 seed...
# 📍 Seeding 12 sectors...
# 📊 Seeding 144 thresholds...
# 🚩 Seeding 96 red flags...
# 📈 Seeding 72 indicators...
# ⚡ Seeding 24 stress tests...
# ⚖️  Seeding 108 domain weights...
# 📋 Seeding malus/bonus rules...
# ⚙️  Seeding app configuration...
# 🎯 Creating V9 scoring model...
# ✅ Data integrity check: [All counts verified]
# 🎉 All V9 data successfully seeded!
```

**Seed Data:**
- File: `prisma/migrations/v9_source_data.json`
- Complete V9 specification from Excel
- 12 sectors: ENR, EAU, TRA, POR, IND, MIN, TOU, TEL, SAN, AGR, ETH, IMM
- 144 thresholds (12 sectors × 3 ratios × 4 levels)
- 96 red flags (8 per sector) with penalties/NO_GO indicators
- 72 indicators (6 per sector) with units and targets
- 24 stress tests (2 per sector) with shock percentages
- 108 domain weights (12 × 9)
- 10 malus/bonus rules
- 9 app configuration defaults

### Step 3: Verify Data Integrity

```bash
# Call the control endpoint
curl http://localhost:3000/api/v9/control

# Expected response:
{
  "success": true,
  "checks": {
    "sectors": 12,
    "thresholds": 144,
    "domainWeights": 108,
    "redFlags": 96,
    "indicators": 72,
    "stressTests": 24,
    "malusBonus": 10,
    "appConfiguration": 9,
    "models": 1
  },
  "expected": { /* same as checks */ },
  "timestamp": "2026-06-13T..."
}
```

---

## Phase 2: Frontend Integration

### Step 1: Update Root Layout

File: `app/layout.tsx`

```tsx
import { AppConfigProvider } from '@/components/providers/app-config-provider';
import { ThemeWrapper } from '@/components/providers/theme-wrapper';
import { getAppConfig } from '@/lib/services/app-config-service';

export default async function RootLayout({ children }) {
  const config = await getAppConfig();

  return (
    <html>
      <body>
        <AppConfigProvider initial={config}>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </AppConfigProvider>
      </body>
    </html>
  );
}
```

### Step 2: Update Tailwind CSS

Add to `tailwind.config.ts`:

```ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary, oklch(0.55 0.13 250))',
        secondary: 'var(--secondary, oklch(0.48 0.09 120))',
      },
      fontFamily: {
        sans: 'var(--font-sans, system-ui)',
      },
    },
  },
};
```

### Step 3: Add Seed Script to package.json

```json
{
  "prisma": {
    "seed": "ts-node --transpile-only prisma/seed-v9.ts"
  }
}
```

---

## Phase 3: API Usage Examples

### Fetch App Configuration

```typescript
// Client-side
import { useAppConfig } from '@/components/providers/app-config-provider';

export function MyComponent() {
  const { config } = useAppConfig();
  
  return (
    <div>
      <h1>{config.APP_NAME}</h1>
      <img src={config.APP_LOGO_URL} />
    </div>
  );
}

// Or server-side
import { getAppConfig } from '@/lib/services/app-config-service';

const config = await getAppConfig();
const appName = config.APP_NAME;
```

### Fetch Sectors

```typescript
import { fetchSectors } from '@/lib/services/v9-sectors-service';

const sectors = await fetchSectors();
// Returns: SectorWithDetails[]
// Each sector has: thresholds, domainWeights, redFlags, indicators, stressTests
```

### Update Configuration

```typescript
// Admin endpoint
const response = await fetch('/api/admin/configuration/APP_NAME', {
  method: 'PUT',
  body: JSON.stringify({ value: 'Nouveau Nom' }),
});

const { data } = await response.json();
// Returns updated configuration with timestamp
// Automatically records in AppConfigHistory
```

### Check Data Integrity

```typescript
const response = await fetch('/api/v9/control');
const { success, checks, expected } = await response.json();

if (!success) {
  console.warn('Data integrity issue:', { checks, expected });
}
```

---

## Phase 4: Admin Configuration Screen

Create `app/admin/configuration/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAppConfig } from '@/components/providers/app-config-provider';

const CONFIG_KEYS = [
  { key: 'APP_NAME', label: 'Nom de l\'outil', type: 'text' },
  { key: 'PRIMARY_COLOR', label: 'Couleur primaire', type: 'color' },
  { key: 'SECONDARY_COLOR', label: 'Couleur secondaire', type: 'color' },
  { key: 'FONT_FAMILY', label: 'Police', type: 'select', options: ['Inter', 'Poppins', 'JetBrains Mono'] },
  { key: 'THEME_MODE', label: 'Thème', type: 'select', options: ['dark', 'light'] },
];

export default function ConfigurationPage() {
  const { config, refresh } = useAppConfig();
  const [updates, setUpdates] = useState<Record<string, string>>({});

  const handleSave = async (key: string) => {
    const response = await fetch(`/api/admin/configuration/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value: updates[key] || config[key] }),
    });

    if (response.ok) {
      await refresh();
      delete updates[key];
      setUpdates({ ...updates });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuration</h1>
      
      {CONFIG_KEYS.map((item) => (
        <div key={item.key} className="space-y-2">
          <label className="block font-medium">{item.label}</label>
          
          {item.type === 'text' && (
            <input
              type="text"
              value={updates[item.key] || config[item.key] || ''}
              onChange={(e) => setUpdates({ ...updates, [item.key]: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          )}

          {item.type === 'color' && (
            <input
              type="text"
              placeholder="oklch(0.55 0.13 250)"
              value={updates[item.key] || config[item.key] || ''}
              onChange={(e) => setUpdates({ ...updates, [item.key]: e.target.value })}
              className="w-full px-3 py-2 border rounded font-mono text-sm"
            />
          )}

          {item.type === 'select' && (
            <select
              value={updates[item.key] || config[item.key] || ''}
              onChange={(e) => setUpdates({ ...updates, [item.key]: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              {item.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => handleSave(item.key)}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Enregistrer
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Database Schema

### Tables Created

| Table | Records | Purpose |
|-------|---------|---------|
| BP_PF_v9_scoring_models | 1 | Model version & metadata |
| BP_PF_v9_sectors | 12 | Project Finance sectors |
| BP_PF_v9_sector_thresholds | 144 | DSCR/LLCR/Leverage ratios |
| BP_PF_v9_sector_domain_weights | 108 | Domain adjustments per sector |
| BP_PF_v9_red_flags | 96 | Nominative red flags with penalties |
| BP_PF_v9_indicators | 72 | Key performance indicators |
| BP_PF_v9_stress_tests | 24 | Stress scenarios |
| BP_PF_v9_malus_bonus | 10 | Penalty/bonus rules |
| BP_PF_v9_anti_double_count | 72 | Anti-double-counting matrix |
| BP_PF_app_configuration | 9 | App settings (name, colors, fonts) |
| BP_PF_app_config_history | ∞ | Audit trail for config changes |

### Key Constraints

- `BP_PF_v9_sectors`: `code` UNIQUE
- `BP_PF_v9_sector_thresholds`: `(sectorId, ratioType, level)` UNIQUE
- `BP_PF_v9_sector_domain_weights`: `(sectorId, domainCode)` UNIQUE
- `BP_PF_v9_red_flags`: `(sectorId, code)` UNIQUE
- `BP_PF_v9_indicators`: `(sectorId, code)` UNIQUE
- `BP_PF_v9_stress_tests`: `(sectorId, code)` UNIQUE
- `BP_PF_v9_malus_bonus`: `code` UNIQUE
- `BP_PF_v9_anti_double_count`: `(factorCode, domainCode)` UNIQUE
- `BP_PF_app_configuration`: `key` PRIMARY KEY

---

## Configuration Keys Reference

| Key | Value | Type | Category | Public | Purpose |
|-----|-------|------|----------|--------|---------|
| APP_NAME | "PF Scoring" | string | branding | Yes | Tool display name |
| APP_LOGO_URL | "/logo.svg" | url | branding | Yes | Logo path/URL |
| PRIMARY_COLOR | "oklch(0.55 0.13 250)" | color | theme | Yes | Main theme color |
| SECONDARY_COLOR | "oklch(0.48 0.09 120)" | color | theme | Yes | Accent color |
| FONT_FAMILY | "Inter" | string | theme | Yes | Typography |
| THEME_MODE | "dark" | enum | theme | Yes | dark \| light |
| CURRENCY | "MAD" | string | behavior | Yes | Dirham marocain |
| DECIMAL_SEPARATOR | "," | string | behavior | Yes | Number formatting |
| THOUSANDS_SEPARATOR | " " | string | behavior | Yes | Number formatting |

---

## Backward Compatibility

✅ **V7++ completely preserved:**
- All existing scoring nodes intact
- All existing evaluations unaffected
- V8 sector adjustments still apply

✅ **V8 tables not modified:**
- BP_PF_v8_sectors
- BP_PF_v8_sector_domain_weights
- BP_PF_v8_sector_red_flags
- BP_PF_v8_sector_stress_tests

✅ **Safe to deploy:**
- Migration is additive only
- No schema changes to existing tables
- RLS policies isolated to V9 tables
- Can rollback by deleting V9 tables

---

## Troubleshooting

### Seed script fails: "Prisma schema validation error"

```bash
# Ensure DATABASE_URL is set
export DATABASE_URL="postgresql://..."
npm run db:seed:v9
```

### Data integrity check fails

```bash
# Check actual counts
npx prisma studio  # UI for inspecting data

# Verify from SQL:
SELECT COUNT(*) as sectors FROM "BP_PF_v9_sectors";
SELECT COUNT(*) as thresholds FROM "BP_PF_v9_sector_thresholds";
```

### Configuration not reflecting in UI

1. Clear browser cache
2. Call `refresh()` from `useAppConfig()` hook
3. Check that config keys are `isPublic: true`
4. Verify AppConfigProvider is in root layout

### Theme colors not applying

1. Ensure `ThemeWrapper` wraps children in layout
2. Check that PRIMARY_COLOR is valid oklch() format
3. Verify Tailwind `extend.colors.primary` references `var(--primary)`

---

## Next Steps

1. **Phase 3**: Design system integration
   - Create Bank* components (BankButton, BankCard, BankTable)
   - Integrate "banque simple" styling
   - Redesign login/dashboard with parameterized colors

2. **Phase 4**: V8→V9 migration pathway
   - Create migration script to copy V8 sectors to V9
   - Update evaluation scoring logic
   - Add toggle between V8 and V9 evaluation modes

3. **Phase 5**: Full deployment to Vercel
   - Ensure environment variables set
   - Run migrations via Supabase dashboard
   - Test in staging environment

---

## Support

For issues or questions:
1. Check data integrity: `/api/v9/control`
2. Review Prisma Studio: `npx prisma studio`
3. Check Supabase dashboard logs
4. Verify migration status: `npx prisma migrate status`
