# PF Scoring V7++ - Comprehensive Scoring System Documentation

## Overview

The PF Scoring V7++ system implements a complete, **100% parameterizable** hierarchical scoring engine that evaluates projects against Basel, IFC, EBRD, and Bank Al-Maghrib compliance standards.

### Key Features

- **Fully Parameterized**: All scoring logic configurable via `ScoringNode` database model
- **Hierarchical**: Recursive tree-based calculation from leaf nodes upward
- **Flexible Methods**: Multiple scoring approaches (options, ranges, numeric, manual, formulas)
- **Rule Engine**: NO-GO, MALUS, and WARNING rules with penalty application
- **Audit Trail**: Complete tracking via `ScoringEvaluationNodeResult` and `ScoringAuditLog`
- **Basel Ratings**: Automatic AAA-D rating calculation based on scores

---

## Architecture

### Core Models

```
ScoringModel
  └─ ScoringModelVersion
      └─ ScoringNode (hierarchical tree)
          ├─ ScoringNodeOption (for choice-based questions)
          ├─ ScoringNodeRange (for numeric ranges)
          ├─ ScoringNodeRule (NO-GO, MALUS, WARNING)
          ├─ ScoringNodeFormula (for complex calculations)
          └─ ScoringNodeApplicabilityRule (conditional visibility)

ScoringEvaluation (instances of evaluations)
  ├─ ScoringEvaluationAnswer (user responses)
  └─ ScoringEvaluationNodeResult (calculated scores)
```

### Workflow Diagram

```
┌─────────────────────────────────────────────┐
│  1. Create ScoringEvaluation                │
│     (project + modelVersion + analyst)      │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  2. Record Answers                          │
│     POST /api/admin/scoring/evaluations/[id]/answers │
│     (nodeId, valueString/valueNumber/etc)   │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  3. Submit Evaluation                       │
│     POST /api/admin/scoring/evaluations/[id] │
│     { action: "submit" }                    │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  4. Calculate Scores (automatic on submit)  │
│     • Load ScoringNodes from version        │
│     • Load answers from evaluation          │
│     • Build hierarchical tree               │
│     • Score leaves (based on answer)        │
│     • Aggregate upward (parent method)      │
│     • Apply rules (penalties)               │
│     • Store results per node                │
│     • Calculate final score & rating        │
└────────────────┬────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────┐
│  5. Results Available                       │
│     • rating: AAA | AA | A | ... | D       │
│     • finalScore: 0-100                     │
│     • node results with detailed breakdown  │
│     • audit trail of all changes            │
└─────────────────────────────────────────────┘
```

---

## Scoring Methods

### 1. OPTION_SCORE (Multiple Choice)

**Setup in ScoringNode:**
- `scoringMethod`: "OPTION_SCORE"
- Create `ScoringNodeOption` entries with value and score

**Example:**
```
Node: Risk Level
├─ Option: Low → score: 90
├─ Option: Medium → score: 60
└─ Option: High → score: 20

User selects: "Low"
Result: rawScore = 90
```

### 2. RANGE_SCORE (Numeric Range)

**Setup in ScoringNode:**
- `scoringMethod`: "RANGE_SCORE"
- Create `ScoringNodeRange` entries defining min/max and score

**Example:**
```
Node: Debt/EBITDA Ratio
├─ Range: < 2.0 → score: 100
├─ Range: 2.0-3.0 → score: 75
├─ Range: 3.0-4.0 → score: 50
└─ Range: > 4.0 → score: 20

User enters: 2.5
Result: rawScore = 75
```

### 3. NUMERIC_DIRECT (Direct Score)

**Setup in ScoringNode:**
- `scoringMethod`: "NUMERIC_DIRECT"
- Value directly maps to score (0-100 range assumed)

**Example:**
```
Node: Financial Health Score (0-100)
User enters: 75
Result: rawScore = 75
```

### 4. MANUAL_SCORE (Analyst Input)

**Setup in ScoringNode:**
- `scoringMethod`: "MANUAL_SCORE"
- Analyst manually assigns score

**Example:**
```
Node: Qualitative Risk Assessment
Analyst scores: 65
Result: rawScore = 65
```

### 5. FORMULA_SCORE (Future)

**Setup in ScoringNode:**
- `scoringMethod`: "FORMULA"
- `ScoringNodeFormula` entries define calculation rules

*Currently stored but not fully evaluated - needs expression parser*

---

## Aggregation Methods

When a parent node has children, it aggregates their scores using the specified method:

### WEIGHTED_AVERAGE
```
score = Σ(childScore × childWeight) / ΣweightValue = (85×0.4 + 70×0.6) / 1.0 = 76.0
```

### SIMPLE_AVERAGE
```
score = (85 + 70 + 65) / 3 = 73.3
```

### SUM
```
score = 85 + 70 + 65 = 220 (can exceed 100)
```

### MIN
```
score = min(85, 70, 65) = 65
```

### MAX
```
score = max(85, 70, 65) = 85
```

---

## Rule Engine

### Rule Types

#### NO-GO (Disqualifying)
- Triggered if condition met
- Typically penalizes score heavily
- Example: "Debt > 10x EBITDA"

#### MALUS (Penalty)
- Applied when certain thresholds exceeded
- Reduces score by penalty value
- Example: "Negative cash flow: -15 points"

#### WARNING
- Informational
- No score impact
- Example: "First-time borrower"

### Rule Evaluation

**Current Implementation:**
```typescript
if (rule.isActive && rule.ruleType === "NO-GO" && nodeScore.rawScore < 25) {
  // Rule triggered
  applyPenalty(penaltyValue);  // Typically negative
}
```

**Future Enhancement:**
- Expression parser for complex conditions
- Variable substitution (e.g., `${nodeA} + ${nodeB} > 100`)
- Conditional rule chains

---

## Rating Determination

Scores (0-100) map to Basel-compliant ratings:

| Rating | Score Range | Interpretation |
|--------|-------------|-----------------|
| **AAA** | 95-100 | Excellent - Minimal Risk |
| **AA** | 85-94 | Very Good - Low Risk |
| **A** | 75-84 | Good - Acceptable Risk |
| **BBB** | 65-74 | Fair - Moderate Risk |
| **BB** | 55-64 | Below Average - Elevated Risk |
| **B** | 45-54 | Weak - High Risk |
| **CCC** | 35-44 | Poor - Very High Risk |
| **CC** | 25-34 | Very Poor - Critical Risk |
| **C** | 15-24 | Highly Risky - Near Default Risk |
| **D** | 0-14 | Default/Distressed |

---

## API Endpoints

### Create Evaluation

```http
POST /api/admin/scoring/evaluations
Content-Type: application/json

{
  "projectId": "uuid",
  "modelId": "uuid",
  "modelVersionId": "uuid",
  "evaluatedBy": "uuid"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "modelVersionId": "uuid",
    "status": "brouillon",
    "createdAt": "2026-04-14T..."
  }
}
```

### Record Answer

```http
POST /api/admin/scoring/evaluations/[id]/answers
Content-Type: application/json

{
  "nodeId": "uuid",
  "valueString": "Low",        // For OPTION_SCORE
  "valueNumber": 2.5,          // For RANGE_SCORE, NUMERIC_DIRECT
  "valueBoolean": true,
  "valueDate": "2026-04-14",
  "manualScore": 75,           // For MANUAL_SCORE
  "comment": "Based on financial statements"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "evaluationId": "uuid",
    "nodeId": "uuid",
    "answerType": "TEXT",
    "valueNumber": 2.5,
    "createdAt": "2026-04-14T..."
  }
}
```

### Get Answers

```http
GET /api/admin/scoring/evaluations/[id]/answers

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nodeId": "uuid",
      "answerType": "TEXT",
      "valueString": "Low",
      "createdAt": "2026-04-14T..."
    }
    // ... more answers
  ]
}
```

### Submit Evaluation (Triggers Scoring)

```http
POST /api/admin/scoring/evaluations/[id]
Content-Type: application/json

{
  "action": "submit"
}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "soumis",
    "submittedAt": "2026-04-14T...",
    "finalScore": 78,
    "rating": "A"
  }
}
```

### Get Evaluation with Results

```http
GET /api/admin/scoring/evaluations/[id]

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "soumis",
    "finalScore": 78,
    "rating": "A",
    "nodeResults": [
      {
        "nodeId": "uuid",
        "rawScore": 85,
        "weightedScore": 34,
        "normalizedScore": 72,
        "explanation": "Weighted average of 3 children",
        "ruleImpactJson": "[...]"
      }
      // ... more results
    ]
  }
}
```

### Approve Evaluation

```http
POST /api/admin/scoring/evaluations/[id]
Content-Type: application/json

{
  "action": "approve"
}

Response 200: { ... status: "valide" ... }
```

### Reject Evaluation

```http
POST /api/admin/scoring/evaluations/[id]
Content-Type: application/json

{
  "action": "reject",
  "reason": "Missing financial statements"
}

Response 200: { ... status: "brouillon" ... }
```

---

## Implementation Details

### Recursive Scoring Algorithm

```typescript
scoreNode(node, allNodes, answers):
  1. Score children first (depth-first)
     for each child in node.children:
       childScore = scoreNode(child, allNodes, answers)
       store(childScore)
  
  2. Score this node
     if node has children AND aggregationMethod:
       nodeScore = aggregate(childScores, method)
     else:
       answer = find answer for this node
       nodeScore = scoreBasedOnMethod(node, answer)
  
  3. Apply rules
     for each rule in node.rules:
       if evaluateCondition(rule, nodeScore):
         appliedRules.push(rule)
         nodeScore -= rule.penaltyValue
  
  4. Store result
     upsert ScoringEvaluationNodeResult(evaluation, node, nodeScore)
  
  5. Return nodeScore
```

### Database Storage

**ScoringEvaluationNodeResult** stores:
- `rawScore`: Score before rule application
- `weightedScore`: rawScore × node.weight
- `normalizedScore`: Score after rule penalties
- `aggregationMethod`: How this score was calculated
- `ruleImpactJson`: Array of rules that affected this score
- `traceJson`: Detailed calculation metadata
- `explanation`: Human-readable description

---

## Best Practices

### Designing Scoring Models

1. **Start with Categories**
   - Financial (Liquidity, Leverage, Profitability)
   - Technical (Equipment, Capacity, Maintenance)
   - Market (Competition, Demand, Prices)
   - Environmental (Compliance, Risks)
   - Social (Employment, Community)
   - Governance (Management, Controls)
   - Legal (Contracts, Litigation)
   - Country (Regulatory, Political)

2. **Use Weights Intentionally**
   - Parent weight affects relative importance of category
   - Child weight determines category's contribution
   - Sum should not exceed 1.0 for WEIGHTED_AVERAGE

3. **Chain Rules Carefully**
   - NO-GO rules (disqualify)
   - MALUS rules (reduce score)
   - WARNING rules (inform)
   - Apply in that order

4. **Test with Sample Data**
   - Create test project
   - Walk through questionnaire
   - Verify calculated scores match expectations
   - Review node results for logic errors

### Common Mistakes

❌ **Hardcoding Score Values**
- Don't put scores in code
- Always use ScoringNode options/ranges

❌ **Circular Parent-Child**
- Node cannot be its own parent
- Prevents infinite loops

❌ **Missing Aggregation Method**
- Parent with children needs method
- Leaf nodes need scoring method

❌ **Overlapping Ranges**
- Define ranges clearly
- Use minIncluded/maxIncluded flags

---

## Configuration Examples

### Simple Binary Question

```
Node: "Operational License Valid?"
├─ scoringMethod: "OPTION_SCORE"
├─ Options:
│  ├─ Yes → 100
│  └─ No → 0
└─ Rules: [NO-GO if score = 0]
```

### Financial Ratio Scoring

```
Node: "Current Ratio"
├─ scoringMethod: "RANGE_SCORE"
├─ Ranges:
│  ├─ > 2.0 → 100
│  ├─ 1.5-2.0 → 80
│  ├─ 1.0-1.5 → 50
│  └─ < 1.0 → 20
└─ Rules: [MALUS -20 if < 1.0]
```

### Risk Assessment Tree

```
Domain: "Financial Risk"
├─ Category: "Liquidity"
│  ├─ Current Ratio (RANGE_SCORE)
│  ├─ Quick Ratio (RANGE_SCORE)
│  ├─ Cash Coverage (RANGE_SCORE)
│  └─ Aggregate: WEIGHTED_AVERAGE (weights: 0.4, 0.35, 0.25)
├─ Category: "Leverage"
│  ├─ Debt/Equity (RANGE_SCORE)
│  ├─ Debt/EBITDA (RANGE_SCORE)
│  └─ Aggregate: SIMPLE_AVERAGE
└─ Aggregate Domain: WEIGHTED_AVERAGE (0.5 each)
```

---

## Troubleshooting

### "Evaluation not found"
- Verify evaluation ID is correct
- Check if evaluation is in correct status for operation

### "Node not found"
- Ensure nodeId belongs to evaluation's modelVersion
- Check node is not archived/inactive

### "Can only record answers on draft evaluations"
- Status must be "brouillon" to record answers
- Cannot change after submission

### "Scores seem wrong"
- Check node aggregation methods
- Verify weights sum appropriately
- Review rule conditions and penalties
- Check answer values match expected type

### Rating not calculated
- Verify evaluation was submitted (triggers calculateScores)
- Check ScoringEvaluationNodeResult records exist
- Confirm finalScore is between 0-100

---

## Future Enhancements

### Phase 5: Admin UI

- Hierarchical scoring grid designer
- Drag-and-drop node tree editor
- Visual weight tuning
- Rule builder with expression parser
- Test evaluation form generator

### Phase 6: Advanced Features

- Multi-currency support
- Temporal scoring (trends over time)
- Stress test scenarios
- Sensitivity analysis
- Scoring model versioning/comparison
- Export to PDF with charts

### Phase 7: Analytics

- Scoring distribution dashboard
- Cluster analysis by category
- Peer comparison
- Historical trend analysis
- Rule effectiveness metrics

---

## Code References

- **Service**: `/lib/services/scoring-evaluation-service.ts`
- **Engine**: `/lib/services/scoring-engine.ts`
- **Alternative Engine**: `/lib/services/generic-scoring-engine.ts`
- **API Routes**: `/app/api/admin/scoring/evaluations/`
- **Database**: `prisma/schema.prisma` (ScoringNode*, ScoringEvaluation*)
- **Tests**: `/tests/scoring/` (when created)

