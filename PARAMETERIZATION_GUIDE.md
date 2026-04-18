# 100% Parameterizable Scoring Configuration Guide

**Status**: ✅ IMPLEMENTED  
**Date**: 2026-04-18  
**Goal**: Zero hardcoded values - all configuration via database and UI dropdowns

---

## Overview

The scoring system is now 100% parameterizable. Every configuration option is:
- Stored in database tables
- Loaded dynamically at runtime
- Editable via admin UI dropdowns
- Extensible without code changes

### No More Hardcoding

**BEFORE** (Hardcoded):
```typescript
// Bad: Change requires code modification
const ANSWER_TYPES = ["OPTION_SINGLE", "NUMERIC_RANGE"];
const AGGREGATION_METHODS = ["AVERAGE", "WEIGHTED_AVERAGE"];
```

**AFTER** (Parameterized):
```typescript
// Good: Change via database and UI
const answerTypes = await getAnswerTypes(); // From database
const methods = await getAggregationMethods(); // From database
```

---

## Configuration Architecture

### Database Tables

All configuration lives in dedicated parameterization tables.

### Service Layer

**File**: `lib/services/scoring-configuration-service.ts`

All configuration loads through this centralized service.

**API Functions**:
```typescript
await getAnswerTypes()           // → AnswerType[]
await getAggregationMethods()    // → AggregationMethod[]
await getWeightModes()           // → WeightMode[]
await getScoreScales()           // → ScoreScale[]
await getRatingScales()          // → RatingScale[]
```

**Features**:
- ✅ Type-Safe Interfaces
- ✅ Automatic Caching (5-min TTL)
- ✅ Database-Driven (No Hardcoded Values)
- ✅ Extensible (Add Types Anytime)

---

## Frontend Components

### ConfigurationDropdown
**File**: `components/admin/ConfigurationDropdown.tsx`

Reusable dropdown for all configurations.

**Usage**:
```tsx
<ConfigurationDropdown
  label="Type de réponse"
  value={answerType}
  onChange={setAnswerType}
  configType="answerTypes"
  placeholder="Sélectionner..."
/>
```

### ModelConfigurationPanel
**File**: `components/admin/ModelConfigurationPanel.tsx`

Configure aggregation method, weight mode, score scale for model.

**Features**:
- ✅ Three dropdowns for model settings
- ✅ Save to database
- ✅ Success/error notifications
- ✅ Auto-refresh questionnaire

---

## API Endpoints

### GET /api/admin/scoring/configuration?type=X

Fetch configuration options.

**Supported Types**:
- `answerTypes`
- `aggregationMethods`
- `weightModes`
- `scoreScales`
- `ratingScales`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "OPTION_SINGLE",
      "label": "Single Option",
      "displayOrder": 1,
      "isActive": true
    }
  ]
}
```

### PUT /api/admin/scoring/model-config?versionId=X

Update model configuration.

**Body**:
```json
{
  "aggregationMethod": "WEIGHTED_AVERAGE",
  "weightMode": "RELATIVE",
  "scoreScale": "0_100"
}
```

---

## Default Configurations

### Answer Types
- OPTION_SINGLE (Dropdown)
- OPTION_MULTI (Checkboxes)
- NUMERIC_RANGE (Input with ranges)
- BOOLEAN (Yes/No)
- TEXT (Free text)
- NUMERIC (Number only)

### Aggregation Methods
- AVERAGE
- WEIGHTED_AVERAGE (Default)
- SUM
- MIN
- MAX
- FIRST

### Weight Modes
- RELATIVE (Default - sum to 100%)
- ABSOLUTE (Fixed values)
- NONE (Equal weight)

### Score Scales
- 0_100 (Default)
- 0_10
- 1_5
- 0_1

### Rating Scales
AAA (95-100), AA (90-94), A (85-89), BBB (75-84), BB (65-74), B (55-64), 
CCC (45-54), CC (35-44), C (25-34), D (0-24)

---

## Workflows

### Add New Answer Type
1. Insert into `BP_PF_v7pp_answer_types`
2. Admin builder dropdown auto-updated
3. No code change needed

### Change Model Configuration
1. Open Admin Builder
2. Use configuration dropdowns
3. Click save
4. Changes apply immediately

### Add New Rating Scale
1. Insert into `BP_PF_v7pp_rating_scales`
2. Evaluations auto-display new ratings
3. No code change needed

---

## Best Practices

✅ Add config via database  
✅ Use ConfigurationDropdown components  
✅ Use `isActive` flag to hide (don't delete)  
✅ Test config changes without deploy  
✅ Leverage caching for performance  

❌ Don't hardcode values  
❌ Don't create manual select elements  
❌ Don't store config in env variables  

---

## Testing

```bash
# Test new answer type
INSERT INTO BP_PF_v7pp_answer_types VALUES 
  ('SLIDER', 'Slider', 'Select value', false, 'input[range]', 7);

# Check admin builder - new type appears in dropdown
# No rebuild needed!

# Test model configuration
# Open /admin/scoring/builder
# Change aggregation method
# Create evaluation - new method applies
```

---

## Summary

✅ **100% Parameterizable** - All config in database  
✅ **UI-Driven** - No SQL needed for basic changes  
✅ **Zero Hardcoding** - No values in code  
✅ **Extensible** - Add types without code change  
✅ **Performant** - Caching reduces load  
✅ **Type-Safe** - Full TypeScript support  

**Result**: Business can configure system behavior without IT.

