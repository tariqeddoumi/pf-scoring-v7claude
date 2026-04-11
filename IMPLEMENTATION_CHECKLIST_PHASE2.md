# 🎯 IMPLEMENTATION CHECKLIST – PHASE 2 BACKEND

**Status:** 🟡 IN PROGRESS  
**Duration:** 10 jours (J3-J12)  
**Owner:** Development Team  
**Target:** Moteur de scoring fonctionnel en TypeScript

---

## 🔷 TASK 1: Scoring Engine Core (4 jours)

### 1.1 Create lib/scoring-engine-v7plus.ts ⏳

**Requirements:**

- [ ] Class `ScoringEngine` initialized
- [ ] Method `calculateDomainScore(domainId, criteria)` → returns number (1-10)
- [ ] Method `calculateGlobalScore()` → aggregates all domains
- [ ] Method `scoreToRating(score)` → transforms to AAA-D
- [ ] Error handling for missing data
- [ ] Unit test coverage > 80%

**Estimated:** 2 days

**Deliverable:** Functional TypeScript class with full test coverage

---

### 1.2 Create lib/scoring-rules-v7plus.ts ⏳

**Requirements:**

- [ ] NO-GO Rules engine (21 conditions)
  - [ ] NOGO_1A: Sponsor rating < CCC
  - [ ] NOGO_1B: Sponsor insolvency
  - [ ] ... (all 21 NOGO rules)
- [ ] MALUS Rules engine (10+ conditions)
  - [ ] MALUS_5A: DSCR < 1.25 without indexation
  - [ ] ... (all MALUS rules)
- [ ] Function `checkNOGOs(projectData)` → returns boolean[] + details
- [ ] Function `applyMALUS(baseScore, projectData)` → returns adjusted score

**Estimated:** 1.5 days

**Deliverable:** Robust rules engine with clear audit trail

---

### 1.3 Create lib/scoring-validators-v7plus.ts ⏳

**Requirements:**

- [ ] Function `validateProjectData(data)` → checks completeness
- [ ] Function `calculateComplexIndicators(data)` → returns:
  - Offtaker Health Index
  - PPA Robustness Score
  - Market Resilience Index
- [ ] Function `runStressScenarios(baseCase)` → returns [scenario1, scenario2, ...]
- [ ] Logging/audit trail of all calculations

**Estimated:** 0.5 days

**Deliverable:** Validation + complex indicator calculations

---

## 🔷 TASK 2: API Endpoints (3 jours)

### 2.1 POST app/api/evaluations/[id]/score/calculate/route.ts ⏳

**Input:**

```json
{
  "projectId": "proj-001",
  "domainScores": {
    "D1": {...},
    "D2": {...},
    ...
  }
}
```

**Output:**

```json
{
  "globalScore": 8.2,
  "rating": "A",
  "probabilityOfDefault": 0.015,
  "domainScores": {...},
  "redFlags": ["NOGO_5A", "MALUS_5B"],
  "recommendation": "APPROVE with monitoring"
}
```

**Checklist:**

- [ ] Route configured
- [ ] Input validation
- [ ] Calculation logic integrated
- [ ] Error handling
- [ ] Response formatting
- [ ] Database save result

**Estimated:** 1 day

---

### 2.2 POST app/api/evaluations/[id]/stress-test/route.ts ⏳

**Input:**

```json
{
  "projectId": "proj-001",
  "scenarios": ["revenue_decline_10", "cost_inflation_5", "rate_increase_200"]
}
```

**Output:**

```json
{
  "scenarios": [
    {
      "name": "Revenue -10%",
      "dscr": 1.28,
      "status": "PASS"
    },
    ...
  ],
  "combinedStress": {
    "dscr": 1.05,
    "status": "CRITICAL"
  }
}
```

**Checklist:**

- [ ] Route configured
- [ ] 6 stress scenarios hardcoded
- [ ] DSCR recalculation logic
- [ ] Pass/Fail determination
- [ ] Sensitivity analysis output

**Estimated:** 1 day

---

### 2.3 GET app/api/evaluations/[id]/report/route.ts ⏳

**Output:** JSON + PDF export capability

**Checklist:**

- [ ] Route configured
- [ ] Report formatting (JSON)
- [ ] PDF generation (optional: use jsPDF)
- [ ] Data serialization

**Estimated:** 1 day

---

## 🔷 TASK 3: Database Schema Integration (2 jours)

### 3.1 Update prisma/schema.prisma ⏳

**New Tables Needed:**

```prisma
model Evaluation {
  id String @id
  projectId String
  domainScores Json  // {D1: 8.4, D2: 8.0, ...}
  globalScore Float
  rating String      // AAA, AA, A, ...
  probabilityOfDefault Float
  redFlags String[]
  malus Json         // {MALUS_5A: -5, ...}
  stressResults Json
  createdAt DateTime
  updatedAt DateTime
}

model ScoringCriteria {
  id String @id
  evaluationId String
  domainId String    // D1, D2, ...
  criterionId String // D1.1, D1.2, ...
  score Float
  notes String?
}
```

**Checklist:**

- [ ] Schema updated
- [ ] Migrations created
- [ ] Relations defined
- [ ] Indexes on key fields

**Estimated:** 1 day

---

### 3.2 Create Prisma Client helpers ⏳

**File:** lib/prisma-scoring.ts

```typescript
export async function saveEvaluation(data) { ... }
export async function fetchEvaluation(id) { ... }
export async function listEvaluations(projectId) { ... }
```

**Checklist:**

- [ ] Helper functions created
- [ ] Error handling
- [ ] Type safety

**Estimated:** 1 day

---

## 🔷 TASK 4: Testing & Validation (2 jours)

### 4.1 Unit Tests (**tests**/scoring-engine.test.ts) ⏳

```typescript
describe("ScoringEngine", () => {
  test("calculateDomainScore D1.1 correctly", () => {...})
  test("calculateGlobalScore normalizes correctly", () => {...})
  test("scoreToRating AAA when score >= 8.5", () => {...})
  // ... 20+ tests
})
```

**Checklist:**

- [ ] Tests written
- [ ] Coverage > 80%
- [ ] All test cases passing
- [ ] Edge cases covered (score=0, score=10, etc.)

**Estimated:** 1 day

---

### 4.2 Integration Tests (**tests**/scoring-api.integration.test.ts) ⏳

```typescript
describe("Scoring API Endpoints", () => {
  test("POST /api/evaluations/[id]/score/calculate", async () => {...})
  test("POST /api/evaluations/[id]/stress-test", async () => {...})
  test("GET /api/evaluations/[id]/report", async () => {...})
})
```

**Checklist:**

- [ ] API endpoints testable
- [ ] Real project test case (solar Maroc)
- [ ] Expected outputs match
- [ ] Error cases handled

**Estimated:** 1 day

---

### 4.3 Validation Against Known Cases ⏳

**Test Cases:**

- [ ] **Case A:** Solar 100MW Maroc → Expected Rating: A
- [ ] **Case B:** Infrastructure Water → Expected Rating: BBB
- [ ] **Case C:** High-Risk Transport → Expected Rating: B
- [ ] **Case D:** NO-GO Project → Expected: REJECT

**Checklist:**

- [ ] Manual scoring vs. automated → variance < 0.5 pts
- [ ] Rating agreement > 95%
- [ ] NO-GO triggering correctly

**Estimated:** 0.5 days

---

## 🔷 TASK 5: Code Quality & Documentation (1 jour)

### 5.1 Code Review ⏳

**Checklist:**

- [ ] Code follows TypeScript strict mode
- [ ] No `any` types (except justified cases)
- [ ] Function documentation complete
- [ ] Error messages clear

**Estimated:** 0.5 days

---

### 5.2 Generate API Documentation ⏳

**File:** SCORING_API_DOCS.md

```markdown
# Scoring API Documentation

## POST /api/evaluations/{id}/score/calculate

Request/Response examples, error codes, etc.
```

**Checklist:**

- [ ] All endpoints documented
- [ ] Request/response examples provided
- [ ] Error codes listed
- [ ] Rate limiting info included

**Estimated:** 0.5 days

---

## 🔷 TASK 6: Deployment & Monitoring (Setup)

### 6.1 Environment Variables ⏳

**Needed:**

- [ ] NEXT_PUBLIC_SCORING_VERSION=7.0
- [ ] SCORING_STRESS_TEST_ENABLED=true
- [ ] SCORING_LOG_LEVEL=info

**Checklist:**

- [ ] .env.local updated
- [ ] Vercel environment variables set
- [ ] Secrets not exposed

---

### 6.2 Logging Setup ⏳

**Checklist:**

- [ ] Scoring calculations logged (INFO level)
- [ ] NO-GO/MALUS decisions logged (WARN level)
- [ ] Errors logged with stack trace
- [ ] Log retention policy defined

---

## 📊 SUMMARY TABLE

| Task                     | Estimated     | Status | Owner  |
| ------------------------ | ------------- | ------ | ------ |
| **Scoring Engine Core**  | 4 days        | 🟡     | Dev    |
| **API Endpoints**        | 3 days        | 🟡     | Dev    |
| **Database Integration** | 2 days        | ⏳     | DB     |
| **Testing & Validation** | 2 days        | ⏳     | QA     |
| **Code Quality**         | 1 day         | ⏳     | Dev    |
| **Deployment Setup**     | 0.5 day       | ⏳     | DevOps |
| **TOTAL**                | **12.5 days** | 🟡     | -      |

---

## 🚀 MILESTONES

**Day 3:** Scoring engine core ✅  
**Day 5:** API endpoints ✅  
**Day 7:** Database integration ✅  
**Day 10:** All tests passing ✅  
**Day 12:** Production-ready 🟢

---

## ⚠️ DEPENDENCIES

- Next.js App Router functional ✅
- Prisma schema in place ⏳
- TypeScript types defined ✅
- Test environment setup ✅

---

## 🎯 SUCCESS CRITERIA

1. ✅ All NO-GO rules triggered correctly (100% accuracy)
2. ✅ Score calculation matches manual version (variance < 0.3 pts)
3. ✅ Stress scenarios run in < 2 seconds
4. ✅ Unit test coverage > 85%
5. ✅ Zero runtime errors on 5 test cases
6. ✅ API response time < 500ms
