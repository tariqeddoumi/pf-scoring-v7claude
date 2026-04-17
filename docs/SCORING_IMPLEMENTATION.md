# Scoring Engine V8 Implementation

## Overview

Scoring Engine V8 is a complete rewrite of the project finance scoring system, introducing:

- **Hierarchical node-based model**: Unlimited depth tree of DOMAIN → CRITERION → SUB_CRITERION → LEAF nodes
- **Data binding system**: Auto-fill answers from Client/Project/Evaluation sources with configurable transforms
- **Source-aware calculation**: Tracks where each answer originated (manual, auto-filled, overridden)
- **Rule engine**: NO-GO, hard stop, malus, warning with condition expressions
- **Basel-compliant rating**: Grades AAA-D with probability of default and committee recommendation
- **Full audit trail**: Change logs + detailed calculation trace with explanations

## Architecture

### Services (lib/services/scoring/)

#### 1. **BindingResolver**
Resolves node data bindings against source entities.

```typescript
// Load bindings for nodes
const bindings = await BindingResolver.loadBindings(nodeIds);

// Resolve one binding given context payloads (Client, Project, Evaluation)
const resolved = BindingResolver.resolveOne(binding, {
  CLIENT: clientData,
  PROJECT: projectData,
  EVALUATION: evaluationData,
  DOCUMENT: null,
  CALCULATED: null,
  EXTERNAL_REFERENCE: null,
  MANUAL: null,
});

// Resolve all bindings for nodes in an evaluation
const resolvedByNode = await BindingResolver.resolveForNodes(nodeIds, {
  evaluationId: "...",
  projectId: "...",
  clientId: "...",
});
```

**Features:**
- Multiple source entities: CLIENT, PROJECT, EVALUATION, DOCUMENT, CALCULATED, EXTERNAL_REFERENCE, MANUAL
- Configurable binding modes: AUTO_READONLY, AUTO_EDITABLE, AUTO_IF_EMPTY, MANUAL_ONLY, CALCULATED_ONLY
- Transform pipeline: NONE, LOOKUP, FORMAT, MAP_VALUE, AGGREGATE, FORMULA, NORMALIZE
- Priority-based resolution: returns highest-priority available binding
- Fallback values & default values

#### 2. **ValueResolver**
Type-coerces and enriches answers with binding-aware snapshots.

```typescript
// Resolve a single answer value with type inference
const snapshot = ValueResolver.resolveValue(rawValue, binding, expectedType);
// → {valueType, rawValue, resolvedValue, isAutoFilled, isOverridden, bindingSource}

// Load a full answer with override tracking
const provenance = await ValueResolver.loadAnswerWithProvenance(evaluationId, nodeId);

// Format value for display
const displayText = ValueResolver.format(snapshot);
```

**Features:**
- Type inference from binding dataType
- Automatic coercion: string → number/boolean/date
- Override reason tracking
- Snapshot storage for audit

#### 3. **ScoreCalculator**
Evaluates nodes based on answer + options/ranges/formulas.

```typescript
// Score from options (categorical answers)
const score = ScoreCalculator.scoreFromOptions(answer, [
  { value: "yes", score: 100 },
  { value: "no", score: 0 },
]);

// Score from ranges (numeric answers)
const score = ScoreCalculator.scoreFromRanges(answer, [
  { min: 0, max: 50, score: 20 },
  { min: 50, max: 100, score: 80 },
]);

// Score from formula
const score = ScoreCalculator.scoreFromFormula("(revenue / expenses) * 100", {
  revenue: 1000000,
  expenses: 800000,
});

// Auto-route to correct method
const score = ScoreCalculator.score(inputs, fallbackScore);
```

**Features:**
- Options matching (categorical)
- Range brackets (numeric)
- Expression evaluation (formulas)
- Explanation trace
- Safe fallback on error

#### 4. **AggregationEngine**
Combines child scores into parent scores.

```typescript
// Aggregate child scores
const parentScore = AggregationEngine.aggregate("WEIGHTED_SUM", children, totalWeight);
// Methods: SUM, WEIGHTED_SUM, AVERAGE, WEIGHTED_AVERAGE, MIN, MAX, COUNT

// Compute weighted score
const weighted = AggregationEngine.computeWeighted(node, totalWeight);

// Normalize to [0,1] or [0,100]
const normalized = AggregationEngine.normalize(score, maxScore);
```

**Features:**
- Multiple aggregation methods (sum, weighted, average, min, max, count)
- Hierarchical weight inheritance
- Normalization to [0,1] range

#### 5. **ModelLoader**
Loads and caches scoring model versions with tree structure.

```typescript
// Load model + build tree
const tree = await ModelLoader.loadVersion(versionId);

// Tree structure
tree.modelId, tree.modelCode, tree.modelLabel
tree.nodesById    // Map<nodeId, NodeMeta>
tree.childrenOf   // Map<parentId, [childId, ...]>
tree.rootNodeIds  // Depth-0 nodes
tree.leafNodeIds  // Terminal/unscored nodes

// Traverse tree depth-first
ModelLoader.traverseDepthFirst(tree, (node, depth) => {
  console.log(node.label);
});

// Get node path (for breadcrumbs)
const path = ModelLoader.getNodePath(tree, nodeId);

// Cache management
ModelLoader.invalidateVersion(versionId);
ModelLoader.clearCache();
```

**Features:**
- In-memory caching by versionId
- Parent-child relationship mapping
- Depth-first traversal
- Path extraction (root → node)

#### 6. **ScoringEngineV8** (Orchestrator)
Unified engine coordinating all services for end-to-end evaluation.

```typescript
// Score an entire evaluation
const trace = await ScoringEngineV8.scoreEvaluation(evaluationId);
// Returns: finalScore, rating, recommendation, rootResults (tree), trace JSON

// Persist results to database
await ScoringEngineV8.persistTrace(trace);
```

**Algorithm:**
1. Load model + all answers + all rules
2. Resolve all bindings once (context payloads cached)
3. **Bottom-up calculation:**
   - For leaf nodes: score from options/ranges/formulas
   - For parent nodes: aggregate children
4. Apply rule impacts (NO-GO, malus, warnings)
5. Compute weights & normalize
6. Generate trace with explanations
7. Persist evaluation + node results

**Output:**
```typescript
{
  evaluationId,
  finalScore,           // Adjusted for malus
  rating,              // Basel grade (AAA-D)
  recommendation,      // Committee text
  malusTotal,
  rootResults: [{
    nodeId, code, label, depth,
    rawScore, weightedScore, normalizedScore,
    ruleImpacts: [{ruleId, code, penalty, message}],
    explanation,
    childResults: [...]
  }],
  traceJson,           // Full tree JSON
  triggeredRuleIds
}
```

## APIs

### Evaluation Lifecycle

**1. Create evaluation**
```bash
POST /api/scoring/evaluations
{
  "projectId": "uuid",
  "modelVersionId": "uuid"
}
→ {id, status: "brouillon", ...}
```

**2. Load questionnaire form**
```bash
GET /api/scoring/evaluations/{id}/form
→ {
  form: [{
    id, code, label, description,
    isScored, isMandatory, weight,
    answer: {id, value, isAutoFilled, isOverridden},
    binding: {id, sourceEntity, bindingMode},
    children: [...]
  }],
  status, finalScore, rating
}
```

**3. Save answers (incremental)**
```bash
PATCH /api/scoring/evaluations/{id}/answers
{
  "answers": [
    {nodeId, value, overrideReason?}
  ]
}
→ {updatedCount: N}
```

**4. Trigger calculation**
```bash
POST /api/scoring/evaluations/{id}/calculate
→ {
  finalScore, rating, recommendation, malusTotal,
  triggeredRuleCount,
  traceUrl: "/api/.../trace"
}
```

**5. Submit for validation**
```bash
POST /api/scoring/evaluations/{id}/submit
{notes?: "..."}
→ {status: "soumise", submittedAt}
```

**6. Get detailed trace**
```bash
GET /api/scoring/evaluations/{id}/trace
→ {
  finalScore, rating, recommendation,
  nodeResults: [{
    nodeCode, nodeLabel,
    rawScore, weightedScore, normalizedScore,
    explanation, ruleImpacts
  }],
  trace: [...] // Full tree
}
```

### Binding Management

**Create binding**
```bash
POST /api/scoring/bindings
{
  nodeId, sourceEntity, sourceField, sourcePath,
  bindingMode, dataType, transformType, transformConfigJson,
  defaultValue, fallbackValue, priority, description
}
```

**List bindings**
```bash
GET /api/scoring/bindings?nodeId=...&sourceEntity=...
```

**Update binding**
```bash
PUT /api/scoring/bindings/{id}
{...updatedFields}
```

**Delete binding** (soft)
```bash
DELETE /api/scoring/bindings/{id}
```

## UI Components

### EvaluationForm
Hierarchical questionnaire with collapsible tree.

```typescript
<EvaluationForm
  evaluationId="..."
  form={[...]}
  onSave={async (answers) => {...}}
/>
```

**Features:**
- Collapsible node tree (chevron icons)
- Auto-fill badges (color-coded by source)
- Type-aware inputs (text, number, boolean, date, select, textarea)
- Dirty tracking
- Save button
- Error handling

### Results Page
Displays final score, rating, node details, rule impacts.

**Features:**
- Summary cards (score, rating, malus, triggered rules)
- Recommendation box
- Node results table with explanations
- Rule impact details
- Status badge

## Database Schema

### Core Tables

**BP_PF_v7pp_scoring_models**
- id, code (unique), label, description
- businessSegment, projectType
- status (DRAFT, PUBLISHED, RETIRED)
- ownerBusinessId (FK → BP_PF_users)
- effectiveDate, expiryDate
- createdAt, updatedAt

**BP_PF_v7pp_scoring_versions**
- id, modelId, versionNumber
- label, status, isPublished
- createdBy, validatedBy, publishedBy (FK → users)
- createdAt, validatedAt, publishedAt, updatedAt

**BP_PF_v7pp_scoring_nodes**
- id, versionId, parentNodeId
- nodeType (DOMAIN, CRITERION, SUB_CRITERION, LEAF, etc)
- code (unique per version), label, shortLabel, description
- depth, orderIndex
- isActive, isTerminal, isScored, isMandatory
- weight, weightMode, aggregationMethod
- answerType, scoringMethod, scoreMin, scoreMax
- unit, currency, defaultValue, uiSchemaJson, metadataJson

**BP_PF_v7pp_scoring_options**
- id, nodeId
- code, label, value
- score, riskLevel, color
- orderIndex, isDefault, isActive

**BP_PF_v7pp_scoring_ranges**
- id, nodeId
- label, minValue, maxValue, minIncluded, maxIncluded
- score, color, orderIndex, isActive

**BP_PF_v7pp_scoring_formulas**
- id, nodeId (unique)
- expression, variablesJson
- minOutput, maxOutput, roundingMode, fallbackValue

**BP_PF_v7pp_scoring_rules**
- id, nodeId, versionId
- ruleType (NO_GO, HARD_STOP, MALUS, WARNING)
- code, label, description
- conditionExpression, severity, actionType, penaltyValue
- blocking, messageUser, messageCommittee
- orderIndex, isActive

**BP_PF_v7pp_applicability_rules**
- id, nodeId
- conditionExpression
- effectType (SHOW, HIDE, REQUIRE, OPTIONAL, EXCLUDE_FROM_SCORE)
- priority, isActive

**BP_PF_v7pp_scoring_evaluations**
- id, projectId, modelId, modelVersionId
- analystId
- status (brouillon, soumise, validee, approuvee, rejetee)
- finalScore, rating, recommendation, probabilityOfDefault, malusTotal
- triggeredRulesJson, summaryJson, notes
- submittedAt, validatedAt, approvedAt
- createdAt, updatedAt

**BP_PF_v7pp_evaluation_answers** (enriched)
- id, evaluationId, nodeId
- answerType, valueString, valueNumber, valueBoolean, valueDate, valueJson
- manualScore, comment, sourceDocumentId
- **NEW:** sourceType, sourceEntity, sourceField, sourcePath, sourceBindingId
- **NEW:** sourceValueSnapshotJson, resolvedValueSnapshotJson
- **NEW:** isAutoFilled, isOverridden, overrideReason, overriddenBy, overriddenAt

**BP_PF_v7pp_evaluation_node_results**
- id, evaluationId, nodeId
- rawScore, weightedScore, normalizedScore
- aggregationMethod, explanation, ruleImpactJson, traceJson

**BP_PF_v7pp_node_data_bindings** (NEW)
- id, nodeId
- sourceEntity (CLIENT, PROJECT, EVALUATION, DOCUMENT, CALCULATED, EXTERNAL_REFERENCE, MANUAL)
- sourceField, sourcePath
- bindingMode (AUTO_READONLY, AUTO_EDITABLE, AUTO_IF_EMPTY, MANUAL_ONLY, CALCULATED_ONLY)
- dataType, transformType, transformConfigJson
- defaultValue, fallbackValue, fallbackMessage
- isRequired, isReadOnly, allowOverride, overrideRequiresReason
- priority, isActive, description
- createdAt, updatedAt

**BP_PF_v7pp_change_logs**
- id, entityType, entityId
- modelId, versionId, evaluationId
- action (CREATE, UPDATE, DELETE, PUBLISH, VALIDATE, SUBMIT, etc)
- fieldName, oldValueJson, newValueJson
- changedBy (FK → users), changedAt, comment

## Usage Example

### 1. Load model for project
```typescript
const project = await prisma.project.findUnique({where: {id: projectId}});
const model = await prisma.scoringModel.findFirst({
  where: {businessSegment: project.secteur, isActive: true}
});
const version = await prisma.scoringModelVersion.findFirst({
  where: {modelId: model.id, isPublished: true},
  orderBy: {versionNumber: 'desc'}
});
```

### 2. Create evaluation
```typescript
const evaluation = await fetch('/api/scoring/evaluations', {
  method: 'POST',
  body: JSON.stringify({projectId, modelVersionId: version.id})
}).then(r => r.json());
```

### 3. User fills form
```typescript
// Get form structure
const form = await fetch(`/api/scoring/evaluations/${evaluation.id}/form`).then(r => r.json());

// Save answers incrementally
await fetch(`/api/scoring/evaluations/${evaluation.id}/answers`, {
  method: 'PATCH',
  body: JSON.stringify({
    answers: [{nodeId: '...', value: 'yes', overrideReason: null}]
  })
});
```

### 4. Calculate score
```typescript
const result = await fetch(
  `/api/scoring/evaluations/${evaluation.id}/calculate`,
  {method: 'POST'}
).then(r => r.json());

console.log(result.finalScore, result.rating, result.recommendation);
```

### 5. View results
```typescript
const trace = await fetch(
  `/api/scoring/evaluations/${evaluation.id}/trace`
).then(r => r.json());

// Detailed node results + tree structure
trace.nodeResults.forEach(r => {
  console.log(`${r.nodeLabel}: ${r.rawScore} → ${r.normalizedScore * 100}%`);
  r.ruleImpacts.forEach(impact => {
    console.log(`  Rule ${impact.ruleCode}: ${impact.message}`);
  });
});
```

### 6. Submit for validation
```typescript
await fetch(`/api/scoring/evaluations/${evaluation.id}/submit`, {
  method: 'POST',
  body: JSON.stringify({notes: "Ready for review"})
});
```

## Next Steps / Future Enhancements

1. **Scoring Designer UI**: Build admin interface to create/edit models and bindings
2. **Document Upload**: Attach supporting documents to evaluations
3. **Batch Scoring**: Score multiple projects in parallel
4. **Approvals Workflow**: Committee review & approval flow
5. **Stress Testing**: Scenario analysis (e.g., "what if revenue drops 20%?")
6. **Data Export**: Export evaluations to Excel/PDF reports
7. **Integration**: Connect to IFRS9 / stress-testing APIs
8. **Expression Engine**: Replace eval() with proper expression parser
9. **Machine Learning**: Calibrate weights using historical decisions
10. **Notifications**: Email alerts on submissions / approvals

## References

- [Scoring Refonte Specifications](./SCORING_REFONTE_SPECIFICATIONS.md)
- [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
- API Documentation: `/docs/swagger.yaml` (TBD)
- Testing: `lib/services/scoring/__tests__/` (TBD)
