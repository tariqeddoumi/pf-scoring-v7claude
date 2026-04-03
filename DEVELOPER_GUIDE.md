# PF Scoring V7++ - Developer Guide

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Styling**: TailwindCSS + shadcn/ui
- **Testing**: Jest + ts-jest

### Project Structure

```
/app              → Next.js routes (App Router)
  /api/           → API endpoints
  /dashboard      → Dashboard pages
  /projects       → Project management

/lib              → Business logic
  /scoring-engine-v7plus.ts      → Main calculation engine
  /scoring-rules-v7plus.ts       → NO-GO & MALUS rules
  /scoring-validators-v7plus.ts  → Data validation
  /db-scoring.ts                 → Database operations

/types            → TypeScript interfaces
  /scoring-v7plus.ts    → All type definitions

/prisma           → Database schema
  /schema.prisma        → Prisma schema

/__tests__        → Test suites
  /unit           → Unit tests
  /integration    → Integration tests
  /fixtures       → Test data
```

---

## Core Components

### 1. ScoringEngine (`lib/scoring-engine-v7plus.ts`)

Main class for calculating project finance scores.

```typescript
class ScoringEngine {
  constructor(projectData: ProjectData) { ... }

  calculateGlobalScore(
    rulesEngine: RulesEngine,
    validator: DataValidator
  ): ScoringResult { ... }

  // Individual domain calculators
  private calculateD1_ProjectFundamentals(): number { ... }
  private calculateD2_HostCountry(): number { ... }
  // ... D3 through D9
}
```

**How it works:**
1. Validates input data
2. Calculates score for each of 9 domains (1-10 scale)
3. Applies domain weights (sum = 135% due to overlapping criteria)
4. Normalizes to 10-point scale
5. Transforms to rating (AAA-D)
6. Maps to Probability of Default

**Extending:** Add new domains by:
1. Adding `DomainCode` enum value
2. Implementing `calculateDX_()` method
3. Adding to domain weight configuration
4. Updating type definitions

---

### 2. RulesEngine (`lib/scoring-rules-v7plus.ts`)

Enforces business rules (NO-GO and MALUS).

```typescript
class RulesEngine {
  checkNOGOs(projectData: ProjectData): NOGORule[] { ... }
  checkMALUS(projectData: ProjectData): MALUSRule[] { ... }

  // Individual rule checkers
  private checkNOGO_1A(p: ProjectData): boolean { ... }
  private checkNOGO_5A(p: ProjectData): boolean { ... }
  // ... all 21 NO-GO rules

  private checkMALUS_5A(p: ProjectData): boolean { ... }
  // ... all 19+ MALUS rules
}
```

**Rule Categories:**
- **NO-GO**: Automatic rejection (21 rules)
- **MALUS**: Score deductions -1 to -5 pts (19+ rules)

**Adding new rules:**

```typescript
// 1. Add rule check method
private checkNOGO_10A(p: ProjectData): boolean {
  return p.someField < threshold;
}

// 2. Create rule object
private createNOGO_10A(): NOGORule {
  return {
    ruleId: "NOGO_10A",
    category: "New Category",
    description: "Rule description",
    triggerCondition: "...",
    impact: "REJECTION",
  };
}

// 3. Add to checkNOGOs() method
nogoRules.push(...rulesEngine.checkNOGO_10A(...));
```

---

### 3. DataValidator (`lib/scoring-validators-v7plus.ts`)

Validates project data completeness and consistency.

```typescript
class DataValidator {
  validateCompleteness(projectData: ProjectData): CompletenessResult { ... }
  validateFields(projectData: ProjectData): ValidationError[] { ... }
  validateBusinessLogic(projectData: ProjectData): ValidationError[] { ... }
}

class ComplexIndicatorsCalculator {
  calculateOfftakerHealthIndex(): number { ... }
  calculatePPARobustnessScore(): number { ... }
  calculateMarketResilienceIndex(): number { ... }
}
```

**Validation levels:**
1. **Completeness**: Check domain-by-domain data availability
2. **Field-level**: Type checking, range validation, format validation
3. **Business logic**: Cross-field validation (e.g., debt + equity = total)

---

### 4. Database Layer (`lib/db-scoring.ts`)

Persistence operations with Prisma ORM.

```typescript
// Evaluation operations
export async function saveEvaluation(
  projectId: string,
  analystId: string,
  scoringResult: ScoringResult,
  stressTestResult?: StressTestResult
): Promise<Evaluation> { ... }

export async function getEvaluation(evaluationId: string): Promise<Evaluation | null> { ... }

// Audit logging
export async function logScoringAction(
  userId: string,
  action: "CALCULATE" | "STRESS_TEST" | "RECALCULATE",
  details?: string,
  changes?: any,
  evaluationId?: string
): Promise<void> { ... }

// Analytics
export async function getProjectEvaluationStats(projectId: string): Promise<Statistics> { ... }
```

---

## Adding a New Domain

Example: Adding Domain D10 (Cyber Security)

### Step 1: Update Types

```typescript
// types/scoring-v7plus.ts

export enum DomainCode {
  D1 = "D1",
  // ...
  D9 = "D9",
  D10 = "D10",  // NEW
}

// Update domain weights
export const DOMAIN_WEIGHTS: Record<DomainCode, number> = {
  D1: 0.20,
  // ...
  D9: 0.10,
  D10: 0.10,  // NEW - adjust others to sum to 135%
};
```

### Step 2: Implement Calculator

```typescript
// lib/scoring-engine-v7plus.ts

private calculateD10_CyberSecurity(): number {
  const cyberSecurityScore = this.projectData.cyberSecurity?.securityLevel ?? 5;
  let score = cyberSecurityScore;

  if (!this.projectData.cyberSecurity?.hasIncidentResponse) {
    score -= 2;
  }
  if (this.projectData.cyberSecurity?.penetrationTestResult === "FAILED") {
    score -= 4;
  }

  this.domainScores.set(DomainCode.D10, {
    domainId: DomainCode.D10,
    domainCode: "CYBER_SECURITY",
    domainName: "Cyber Security",
    weight: DOMAIN_WEIGHTS[DomainCode.D10],
    subCriteria: [],
    aggregatedScore: Math.max(1, Math.min(10, score)),
    rating: this.scoreToRating(score),
    probabilityOfDefault: this.getProbabilityOfDefault(score),
  });

  return this.domainScores.get(DomainCode.D10)!.aggregatedScore;
}
```

### Step 3: Update Aggregate Calculation

```typescript
// In calculateGlobalScore()
const d10Score = this.calculateD10_CyberSecurity();

// Add to weighted sum
const weightedScores = [
  d1Score * DOMAIN_WEIGHTS[DomainCode.D1],
  // ...
  d10Score * DOMAIN_WEIGHTS[DomainCode.D10],  // NEW
];
```

### Step 4: Add Tests

```typescript
// __tests__/unit/scoring-engine.test.ts

it("D10: Cyber Security should score appropriately", () => {
  const result = engine.calculateGlobalScore(rulesEngine, validator);
  const d10 = result.domains.D10;

  if (d10) {
    expect(d10.aggregatedScore).toBeGreaterThan(0);
    expect(d10.aggregatedScore).toBeLessThanOrEqual(10);
  }
});
```

---

## Adding a New NO-GO Rule

Example: Adding NOGO_10A (Cyber Breach)

### Step 1: Implement Rule Check

```typescript
// lib/scoring-rules-v7plus.ts

private checkNOGO_10A(p: ProjectData): boolean {
  return (p.cyberSecurity?.penetrationTestResult === "CRITICAL" ||
          p.cyberSecurity?.historicalBreaches > 2);
}

private createNOGO_10A(): NOGORule {
  return {
    ruleId: "NOGO_10A",
    category: "Cyber Security",
    description: "Critical cyber security vulnerabilities",
    triggerCondition: "Penetration test critical or >2 historical breaches",
    impact: "REJECTION",
    workaround: "Implement comprehensive cyber security program + insurance",
  };
}
```

### Step 2: Add to checkNOGOs()

```typescript
if (this.checkNOGO_10A(projectData)) {
  nogoRules.push(this.createNOGO_10A());
}
```

### Step 3: Test

```typescript
it("should trigger NOGO_10A for critical cyber vulnerabilities", () => {
  const vulnerableData = {
    ...SOLAR_MAROC_FIXTURE,
    cyberSecurity: {
      penetrationTestResult: "CRITICAL",
    },
  };

  const nogoRules = rulesEngine.checkNOGOs(vulnerableData);
  expect(nogoRules.some(rule => rule.ruleId === "NOGO_10A")).toBe(true);
});
```

---

## API Endpoint Development

### Creating a New Endpoint

```typescript
// app/api/evaluations/[id]/custom-analysis/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const evaluationId = context.params.id;
    const body = await request.json();

    // Business logic
    const result = performCustomAnalysis(body.projectData);

    // Save to database
    await logScoringAction(
      body.analystId,
      "CUSTOM_ANALYSIS",
      "Custom analysis performed",
      undefined,
      evaluationId
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

---

## Running Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests (requires dev server)
npm run dev  # Terminal 1
npm run test:integration  # Terminal 2

# All tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Database Schema Extensions

### Adding a New Table

```prisma
// prisma/schema.prisma

model CustomAnalysisResult {
  id              String   @id @default(uuid())
  evaluationId    String
  analysisType    String
  results         Json
  createdAt       DateTime @default(now())

  evaluation      Evaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)

  @@index([evaluationId])
  @@map("custom_analysis_results")
}

// Update Evaluation model
model Evaluation {
  // ... existing fields
  customAnalysis  CustomAnalysisResult[]
}
```

### Create Migration

```bash
npx prisma migrate dev --name add_custom_analysis
```

---

## Performance Optimization

### Caching Scoring Results

```typescript
// Use Redis or similar for caching expensive calculations
const cacheKey = `score:${projectId}:${version}`;
const cached = await cache.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = engine.calculateGlobalScore(...);
await cache.set(cacheKey, JSON.stringify(result), 3600); // 1 hour

return result;
```

### Batch Processing

```typescript
// Process multiple projects
async function batchScore(projectIds: string[]): Promise<ScoringResult[]> {
  const results = await Promise.all(
    projectIds.map(id =>
      fetch(`/api/evaluations/${id}/score/calculate`, {
        method: "POST",
        body: JSON.stringify({ projectData: getProjectData(id) }),
      }).then(r => r.json())
    )
  );

  return results;
}
```

---

## Debugging

### Enable Debug Logging

```typescript
// Set NODE_DEBUG environment variable
NODE_DEBUG=scoring npm run dev

// Or in code
if (process.env.DEBUG_SCORING) {
  console.log("[SCORING DEBUG]", domainScores);
}
```

### TypeScript Debugging

```bash
# Generate source maps
npm run build

# Run with Node debugger
node --inspect-brk ./dist/server.js
```

---

## Deployment Considerations

### Environment Variables

```bash
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
JWT_SECRET=...
```

### Pre-deployment Checklist

- [ ] All tests pass: `npm test`
- [ ] TypeScript strict: `npm run type-check`
- [ ] Linting: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Backup production database

---

## Troubleshooting

### Common Issues

**Issue**: TypeScript compilation fails
```
Solution: npm run type-check -- --diagnostics
```

**Issue**: Prisma client not generated
```
Solution: npx prisma generate
```

**Issue**: Database migration fails
```
Solution: npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Contributing Guidelines

1. **Code Style**: Follow TypeScript strict mode
2. **Testing**: New features require unit + integration tests
3. **Documentation**: Update API_DOCUMENTATION.md
4. **Commits**: Use conventional commit format
5. **Branches**: Feature branches from `main`

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

---

## Future Enhancement Roadmap

- [ ] Machine learning model for score prediction
- [ ] Advanced portfolio analysis
- [ ] Real-time market data integration
- [ ] Multi-currency support
- [ ] Custom rule builder UI
- [ ] Advanced reporting (PDF, Excel)
- [ ] API rate limiting + pagination
- [ ] Webhook notifications
- [ ] GraphQL API alongside REST
