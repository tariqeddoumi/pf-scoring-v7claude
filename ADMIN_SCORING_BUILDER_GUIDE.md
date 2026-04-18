# Admin Scoring Model Builder Guide

## Overview

This document describes the complete admin interface for managing the PF V7++ scoring model. Users can now create, edit, and delete domains, criteria, scoring options, and numeric ranges through an intuitive web interface.

## Architecture

### Backend API Endpoints

All endpoints require authentication and admin privileges.

#### Node Management (Domains & Criteria)

**POST /api/admin/scoring/nodes**
- Create a new domain (depth=0) or criterion (depth=1)
- Request body:
```json
{
  "versionId": "version-id",
  "parentNodeId": null,          // null for domains, domain_id for criteria
  "nodeType": "DOMAIN",          // or "CRITERION"
  "code": "D1",                  // Must be unique per version
  "label": "Financial Analysis",
  "shortLabel": "Finance",
  "description": "Domain description",
  "depth": 0,                    // 0 for domain, 1 for criterion
  "orderIndex": 0,
  "weight": 0.10,                // Domain/criterion weight (0-1)
  "answerType": "OPTION_SINGLE"  // or "NUMERIC_RANGE" for criteria
}
```
- Returns: Created node with all fields
- Validation: Code uniqueness per version, required fields check

**PUT /api/admin/scoring/nodes?nodeId=X**
- Update node properties
- Request body (partial):
```json
{
  "label": "Updated Label",
  "shortLabel": "Updated",
  "description": "New description",
  "weight": 0.15,
  "orderIndex": 1
}
```
- Returns: Updated node

**DELETE /api/admin/scoring/nodes?nodeId=X**
- Delete a node and all its children
- Cascades deletion to all child criteria, options, and ranges
- Returns: `{ success: true }`

#### Option Management

**POST /api/admin/scoring/options**
- Add a scoring option to a criterion
- Request body:
```json
{
  "criterionId": "criterion-id",
  "label": "Excellent",
  "score": 90,
  "description": "Score description"
}
```
- Returns: Created option
- Validation: Criterion exists and is type CRITERION

**PUT /api/admin/scoring/options?optionId=X**
- Update option properties
- Request body (partial):
```json
{
  "label": "Excellent Performance",
  "score": 95,
  "description": "Updated description"
}
```
- Returns: Updated option

**DELETE /api/admin/scoring/options?optionId=X**
- Delete an option
- Returns: `{ success: true }`

#### Range Management

**POST /api/admin/scoring/ranges**
- Add a numeric range to a criterion
- Request body:
```json
{
  "criterionId": "criterion-id",
  "minValue": 0,
  "maxValue": 100,
  "score": 80,
  "label": "Excellent Range"
}
```
- Returns: Created range
- Validation: minValue <= maxValue, criterion is type CRITERION

**PUT /api/admin/scoring/ranges?rangeId=X**
- Update range properties
- Request body (partial):
```json
{
  "minValue": 10,
  "maxValue": 100,
  "score": 85,
  "label": "High Performance"
}
```
- Returns: Updated range
- Validation: minValue <= maxValue

**DELETE /api/admin/scoring/ranges?rangeId=X**
- Delete a range
- Returns: `{ success: true }`

### Frontend Components

#### Admin Scoring Page
**Path:** `/admin/scoring`
- Read-only view of the complete scoring model
- Shows all domains and criteria with metadata
- Displays weight percentages for each domain
- Shows answer types (OPTION_SINGLE vs NUMERIC_RANGE)
- Expandable detail views showing options and ranges
- Link to builder page for editing

#### Admin Scoring Builder
**Path:** `/admin/scoring/builder`
- Full CRUD interface for model management
- Features:
  * Hierarchical tree view of domains and criteria
  * Inline create/edit/delete buttons for all entities
  * Weight validation indicator (target: 1.0 total)
  * Model statistics dashboard
  * Expandable options/ranges detail editors

#### Modal Components

**NodeModal** (`components/scoring/NodeModal.tsx`)
- Create/edit domains and criteria
- Fields: code, label, shortLabel, description, weight, answerType
- Validation: Code uniqueness (on create), required fields

**OptionModal** (`components/scoring/OptionModal.tsx`)
- Create/edit scoring options
- Fields: label, score (0-100), description
- Inline criterion code display for context

**RangeModal** (`components/scoring/RangeModal.tsx`)
- Create/edit numeric ranges
- Fields: minValue, maxValue, score (0-100), label (optional)
- Validation: minValue <= maxValue

## User Workflows

### Creating a Domain

1. Navigate to `/admin/scoring/builder`
2. Click "Ajouter Domaine" button (bottom right)
3. Fill in domain form:
   - Code: D10 (unique identifier)
   - Libellé: "New Domain"
   - Poids: 0.10 (weight as decimal)
4. Click "Créer"
5. Domain appears in tree view

### Creating a Criterion

1. Expand desired domain by clicking on it
2. Click "Ajouter Critère" button (within domain or at bottom)
3. Fill in criterion form:
   - Code: D10.1 (parent domain code + suffix)
   - Libellé: "Criterion Name"
   - Type: Choose OPTION_SINGLE or NUMERIC_RANGE
   - Poids: Individual criterion weight
4. Click "Créer"

### Adding Scoring Options

1. Expand criterion in builder
2. Click + button in "Options" section
3. Fill form:
   - Libellé: "Excellent"
   - Score: 90 (0-100)
4. Click "Ajouter"

### Adding Numeric Ranges

1. Expand criterion in builder
2. Click + button in "Plages" section
3. Fill form:
   - Valeur min: 0
   - Valeur max: 100
   - Score: 75
   - Libellé (optional): "High"
4. Click "Ajouter"

### Editing Entities

1. Find entity in tree (domain/criterion/option/range)
2. Click edit icon (pencil) next to item
3. Modal opens with pre-filled data
4. Modify fields
5. Click "Modifier"

### Deleting Entities

1. Find entity in tree
2. Click delete icon (trash) next to item
3. Confirm deletion dialog
4. Item removed from tree

## Data Model

### ScoringNode
- Hierarchical structure: DOMAIN → CRITERION
- Domains at depth=0, criteria at depth=1
- Relations: parent (domain), children (criteria), options, ranges

### ScoringOption
- Belongs to one criterion
- Has label and score (0-100)
- Optional description
- OrderIndex for list ordering

### ScoreRange
- Belongs to one criterion
- minValue, maxValue boundaries
- Score for range (0-100)
- Optional label for range
- OrderIndex for list ordering

## Validation Rules

1. **Code Uniqueness:** Node codes must be unique within a version
2. **Weight Sum:** All domain weights should sum to ~1.0 (indicator shows % in UI)
3. **Range Logic:** minValue must be ≤ maxValue
4. **Answer Type:** Criterion must have EITHER options OR ranges (enforced by schema)
5. **Required Fields:** Code, label, and depth are always required

## Performance Considerations

- Model tree loads with nested relations (children, options, ranges)
- Ordered by depth then orderIndex for consistent display
- Delete cascades automatically via Prisma relations
- Modals use async/await with loading states
- No real-time updates (manual refresh required after operations)

## Error Handling

All API responses follow this format:
```json
{
  "success": true,
  "data": { ... }
}
```

Errors return:
```json
{
  "error": "Human-readable error message",
  "errorCode": "VALIDATION_ERROR|NOT_FOUND|INTERNAL_ERROR",
  "errors": []  // Optional: field-level validation errors
}
```

## Integration with Scoring Engine

The admin builder modifies the underlying `scoringNode`, `scoringOption`, and `scoreRange` tables. Changes are immediately available to:
- `/api/scoring/questionnaire` - Returns complete model structure
- `/api/scoring/evaluations/[id]/calculate` - Score calculation uses updated definitions
- Evaluation creation uses latest definitions

## Future Enhancements

- [ ] Bulk import/export (JSON, CSV)
- [ ] Clone domain/criterion with sub-items
- [ ] Versioning/rollback capability
- [ ] Reorder domains and criteria (drag-drop)
- [ ] Validation report showing weight coverage issues
- [ ] Preview evaluation form with current criteria
- [ ] Audit log of parameter changes

## Troubleshooting

**Problem:** Modal won't close after submit
- Check browser console for API errors
- Verify network request succeeded
- Check that required fields are filled

**Problem:** Options/ranges not appearing
- Expand the criterion by clicking it
- Verify options were created (check API response)
- Refresh page to reload data

**Problem:** Weight validation failing
- Check sum of all domain weights
- Should total ~1.0 (100%)
- Adjust individual weights to match

## Testing

To test the admin builder:
1. Ensure database is seeded with model data
2. Navigate to `/admin/scoring/builder`
3. Try create/edit/delete operations
4. Verify changes reflect in `/admin/scoring` view
5. Verify scoring still works in `/evaluations/new`

## Code References

- API routes: `/app/api/admin/scoring/[nodes|options|ranges]/route.ts`
- Frontend: `/app/admin/scoring/builder/page.tsx`
- Modals: `/components/scoring/[NodeModal|OptionModal|RangeModal].tsx`
- Old admin view: `/app/admin/scoring/page.tsx` (read-only)
