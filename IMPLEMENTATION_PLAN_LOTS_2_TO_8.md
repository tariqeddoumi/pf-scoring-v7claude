# Implementation Plan - Lots 2 to 8

**Branch:** `refactor/v7pp-5-security` (security baseline complete)  
**Next Branch:** `refactor/v7pp-5-api-rbac` (Lot 2)  
**Duration:** 2-3 weeks total  
**Status:** Ready to execute

---

## Lot 2: API Endpoints RBAC (1-2 days)

### Objective
Protect all `/api/admin/*` endpoints with role-based access control. Standardize all API responses.

### Step 1: Identify Unprotected Admin Endpoints

```bash
# Find all admin routes
find app/api/admin -name "route.ts" -type f | sort

# Check which ones DON'T have withAdminAuth
for file in $(find app/api/admin -name "route.ts"); do
  if ! grep -q "withAdminAuth" "$file"; then
    echo "UNPROTECTED: $file"
  fi
done
```

### Step 2: Create Standard Response Utility

**File:** `lib/api-response.ts` (NEW)

```typescript
import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: { count?: number; cursor?: string };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function successResponse<T>(
  data: T,
  meta?: any
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    meta,
  });
}

export function errorResponse(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function unauthorizedResponse() {
  return errorResponse(
    "UNAUTHORIZED",
    "Authentication required",
    undefined,
    401
  );
}

export function forbiddenResponse(reason?: string) {
  return errorResponse(
    "FORBIDDEN",
    reason || "Insufficient permissions",
    undefined,
    403
  );
}

export function notFoundResponse(resource: string) {
  return errorResponse(
    "NOT_FOUND",
    `${resource} not found`,
    undefined,
    404
  );
}

export function validationError(
  message: string,
  details?: any
) {
  return errorResponse(
    "VALIDATION_ERROR",
    message,
    details,
    400
  );
}

export function internalError(message: string) {
  return errorResponse(
    "INTERNAL_ERROR",
    message,
    undefined,
    500
  );
}
```

### Step 3: Update All Admin Endpoints

**Template for each endpoint:**

```typescript
// OLD PATTERN
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // No authentication!
  // ...
}

// NEW PATTERN
import { NextRequest } from "next/server";
import { withAdminAuth } from "@/lib/auth-middleware";
import { successResponse, forbiddenResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, user) => {
    // Optional: Check specific permission
    if (!checkPermission(user.role, "read")) {
      return forbiddenResponse("Read permission required");
    }
    
    // Your logic here
    // return successResponse(data);
  });
}

function checkPermission(role: string, action: string): boolean {
  const PERMISSIONS: Record<string, string[]> = {
    system_admin: ["read", "create", "update", "delete", "configure"],
    scoring_admin: ["read", "create", "update", "delete", "configure_scoring"],
    risk_manager: ["read", "approve"],
    risk_analyst: ["read", "create", "update"],
    read_only: ["read"],
  };
  return (PERMISSIONS[role] || []).includes(action);
}
```

### Step 4: Test Each Endpoint

```bash
# Test with valid token (assuming you have one)
export TOKEN="your-jwt-token-here"

# Should return 200
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/users

# Should return 401 (no token)
curl http://localhost:3000/api/admin/users

# Should return 403 (wrong role)
# Requires token with role: "read_only"
curl -H "Authorization: Bearer $READ_ONLY_TOKEN" \
  http://localhost:3000/api/admin/scoring-models/manage
```

### Deliverables for Lot 2
- [ ] Utility: `lib/api-response.ts`
- [ ] All `/api/admin/*` endpoints use `withAdminAuth()`
- [ ] All responses follow standard format
- [ ] Tests pass: `npm run type-check && npm run build`
- [ ] Manual testing with different roles

---

## Lot 3: Database Rationalization (2-3 days)

### Objective
Decide canonical model, add missing tables, prepare migration strategy.

### Step 1: Canonical Model Decision (Already made)

**Decision:** Use V7++ (ScoringNode/ScoringModelVersion)  
**Action:** Deprecate legacy tables

### Step 2: Add Missing Tables to Prisma Schema

**File:** `prisma/schema.prisma` (ADD these models)

```prisma
// Workflow tables
model WorkflowDefinition {
  id        String   @id @default(cuid())
  name      String
  steps     WorkflowDefinitionStep[]
  createdAt DateTime @default(now())
}

model WorkflowDefinitionStep {
  id           String   @id @default(cuid())
  definitionId String
  definition   WorkflowDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)
  name         String
  requiredRole String? // "manager", "committee", etc
  order        Int
}

model WorkflowInstance {
  id             String   @id @default(cuid())
  evaluationId   String
  evaluation     ScoringEvaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  currentStatus  String // "draft", "submitted", "approved", etc
  currentStepId  String?
  steps          WorkflowInstanceStep[]
  actions        WorkflowActionLog[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model WorkflowInstanceStep {
  id           String   @id @default(cuid())
  instanceId   String
  instance     WorkflowInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  stepName     String
  status       String // "pending", "completed", "skipped"
  completedAt  DateTime?
  completedBy  String?
  comments     String?
}

model WorkflowActionLog {
  id          String   @id @default(cuid())
  instanceId  String
  instance    WorkflowInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  action      String // "submitted", "approved", "rejected", "returned"
  actor       String // user email
  comment     String?
  timestamp   DateTime @default(now())
}

// Override tables
model ScoringEvaluationOverride {
  id            String   @id @default(cuid())
  evaluationId  String
  evaluation    ScoringEvaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  nodeId        String
  node          ScoringNode @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  originalScore Float?
  overriddenScore Float
  reason        String // "MALUS", "WAIVER", "SPECIAL_CIRCUMSTANCES", etc
  justification String
  overriddenBy  String // user email
  approvedBy    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ScoringEvaluationApproval {
  id           String   @id @default(cuid())
  evaluationId String
  evaluation   ScoringEvaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  approver     String // user email
  role         String // "manager", "committee", etc
  status       String // "pending", "approved", "rejected"
  comment      String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// Decision tables
model ScoringEvaluationDecision {
  id           String   @id @default(cuid())
  evaluationId String
  evaluation   ScoringEvaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  globalScore  Float
  rating       String // "AAA", "AA", "A", "BBB", etc
  recommendation String // "APPROVED", "CONDITIONAL", "REJECTED"
  summary      String?
  decidedBy    String // user email
  decidedAt    DateTime
  createdAt    DateTime @default(now())
}

// Document tables
model DocumentType {
  id             String   @id @default(cuid())
  code           String   @unique
  label          String
  description    String?
  requiredCount  Int @default(0)
  validityMonths Int?
  isActive       Boolean @default(true)
}

model ProjectDocument {
  id       String   @id @default(cuid())
  projectId String
  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  typeId   String
  type     DocumentType @relation(fields: [typeId], references: [id])
  name     String
  url      String?
  status   String // "received", "missing", "obsolete", "valid"
  version  String?
  validFrom DateTime?
  validTo  DateTime?
  uploadedAt DateTime @default(now())
  uploadedBy String
}

model DocumentRequirement {
  id           String   @id @default(cuid())
  nodeId       String
  node         ScoringNode @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  documentType String // "financial_statements", "contracts", etc
  isMandatory  Boolean @default(false)
  description  String?
}

model DocumentValidation {
  id            String   @id @default(cuid())
  evaluationId  String
  evaluation    ScoringEvaluation @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  documentId    String
  documentName  String
  isCompliant   Boolean
  comments      String?
  validatedBy   String
  validatedAt   DateTime @default(now())
}
```

### Step 3: Create Migration

```bash
# Generate migration
npx prisma migrate dev --name add_workflow_override_decision_tables

# This creates: prisma/migrations/[timestamp]_add_workflow_override_decision_tables/migration.sql
```

### Step 4: Update Relations in ScoringEvaluation

```prisma
model ScoringEvaluation {
  // ... existing fields
  
  // New relations
  workflow          WorkflowInstance?
  overrides         ScoringEvaluationOverride[]
  approvals         ScoringEvaluationApproval[]
  decision          ScoringEvaluationDecision?
  documents         ProjectDocument[]
  documentValidations DocumentValidation[]
}

model ScoringNode {
  // ... existing fields
  
  // New relations
  documentRequirements DocumentRequirement[]
  overrides            ScoringEvaluationOverride[]
}

model Project {
  // ... existing fields
  
  // New relation
  documents ProjectDocument[]
}
```

### Deliverables for Lot 3
- [ ] Prisma schema updated with new tables
- [ ] Migration created and tested
- [ ] Database structure documented
- [ ] Legacy table deprecation plan created

---

## Lot 4: Scoring Engine Refactor (3-5 days)

### Objective
Fix scoring calculation to be truly bottom-up. Remove eval(). Implement rule engine.

### Step 1: Review Current Scoring Engine

Files to analyze:
- `lib/services/scoring/scoring-engine-v8.ts`
- `lib/services/scoring/score-calculator.ts`
- `lib/services/scoring/aggregation-engine.ts`

Issue: Uses DFS which visits parents before children, but needs post-order traversal.

### Step 2: Create New Scoring Engine Structure

**File:** `lib/services/scoring/scoring-engine-v9.ts` (NEW)

```typescript
/**
 * Scoring Engine V9 - Production-ready
 * - Real post-order traversal (bottom-up)
 * - No eval() - safe formula parsing
 * - Complete audit trail
 * - Rule engine with NO_GO, malus, warnings
 */

import { ScoringNode, ScoringEvaluation, ScoringEvaluationAnswer } from "@prisma/client";

export interface ScoringResult {
  nodeId: string;
  rawScore: number;
  normalizedScore: number;
  weightedScore: number;
  weight: number;
  childrenScores: ScoringResult[];
  rules: RuleResult[];
  explanation: string;
  timestamp: Date;
}

export interface RuleResult {
  ruleId: string;
  name: string;
  type: "MALUS" | "NO_GO" | "WARNING" | "BONUS";
  triggered: boolean;
  value?: number;
  justification?: string;
}

export class ScoringEngineV9 {
  async calculateEvaluation(
    evaluation: ScoringEvaluation,
    nodes: ScoringNode[],
    answers: ScoringEvaluationAnswer[],
    model: any
  ): Promise<ScoringResult> {
    // TODO: Implement complete scoring logic
    // 1. Build tree structure
    // 2. Post-order traversal (leaves first)
    // 3. Calculate each leaf
    // 4. Aggregate up the tree
    // 5. Apply rules
    // 6. Return complete result tree
  }

  private postOrderTraverse(node: any, callback: (node: any) => void) {
    // Process children first (post-order)
    for (const child of node.children || []) {
      this.postOrderTraverse(child, callback);
    }
    // Then process this node
    callback(node);
  }

  private calculateLeafScore(node: ScoringNode, answer: ScoringEvaluationAnswer): number {
    // TODO: Based on answer type and node config
    // - For options: lookup score from ScoringNodeOption
    // - For ranges: lookup score from ScoringNodeRange
    // - For formula: parse and evaluate safely
  }

  private aggregateChildrenScores(node: ScoringNode, children: ScoringResult[]): number {
    // TODO: Apply aggregation method
    // - AVERAGE
    // - WEIGHTED_AVERAGE (use weights)
    // - SUM
    // - MIN
    // - MAX
  }

  private applyRules(node: ScoringNode, score: number): { score: number; rules: RuleResult[] } {
    // TODO: Apply scoring rules
    // - Check NO_GO conditions
    // - Apply malus/bonus
    // - Generate warnings
  }

  private safeEvaluateFormula(formula: string, context: any): number {
    // TODO: Safe formula evaluation (no eval())
    // Use: https://www.npmjs.com/package/expr-eval
    // or similar safe expression evaluator
  }
}
```

### Step 3: Create Formula Parser

**File:** `lib/services/scoring/formula-parser.ts` (NEW)

```typescript
/**
 * Safe formula parser - NO EVAL()
 * Supports: MIN, MAX, AVG, SUM, IF, ROUND, ABS, RATIO, CLAMP
 */

import { Parser } from "expr-eval"; // npm install expr-eval

export class FormulaParser {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  evaluate(formula: string, variables: Record<string, number>): number {
    try {
      const expr = this.parser.parse(formula);
      return expr.evaluate(variables);
    } catch (error) {
      throw new Error(`Invalid formula: ${formula}`);
    }
  }

  // Supported functions
  private functions = {
    MIN: Math.min,
    MAX: Math.max,
    AVG: (arr: number[]) => arr.reduce((a, b) => a + b) / arr.length,
    SUM: (arr: number[]) => arr.reduce((a, b) => a + b),
    ABS: Math.abs,
    ROUND: Math.round,
    CLAMP: (value: number, min: number, max: number) =>
      Math.max(min, Math.min(value, max)),
  };
}
```

### Step 4: Create Rule Engine

**File:** `lib/services/scoring/rule-engine.ts` (NEW)

```typescript
/**
 * Rule Engine - Apply business rules
 */

export interface Rule {
  id: string;
  type: "NO_GO" | "MALUS" | "BONUS" | "WARNING" | "MANDATORY_IF";
  condition: string; // Formula
  value?: number;
  justification?: string;
}

export class RuleEngine {
  async evaluateRules(
    node: ScoringNode,
    score: number,
    context: any
  ): Promise<{ finalScore: number; rules: any[] }> {
    const rules = node.rules || [];
    let finalScore = score;
    const triggered: any[] = [];

    for (const rule of rules) {
      // Evaluate rule condition
      if (this.evaluateCondition(rule.condition, context)) {
        triggered.push({
          ruleId: rule.id,
          type: rule.type,
          triggered: true,
        });

        // Apply rule effect
        switch (rule.type) {
          case "MALUS":
            finalScore -= rule.value || 0;
            break;
          case "BONUS":
            finalScore += rule.value || 0;
            break;
          case "NO_GO":
            finalScore = -1; // Special marker for no-go
            break;
        }
      }
    }

    return { finalScore, rules: triggered };
  }

  private evaluateCondition(condition: string, context: any): boolean {
    // TODO: Evaluate condition safely
    return true; // Placeholder
  }
}
```

### Deliverables for Lot 4
- [ ] Scoring engine v9 implemented (post-order, bottom-up)
- [ ] Formula parser (no eval())
- [ ] Rule engine (NO_GO, malus, warnings, bonus)
- [ ] Complete audit trail for each score
- [ ] Tests for all scoring scenarios

---

## Lot 5: Backend Standardization (2-3 days)

Already covered in Lot 2. Lot 5 is about:
- [ ] Error handling consistency
- [ ] Validation layer (Zod)
- [ ] Middleware for permissions
- [ ] Rate limiting

### Create Validation Schemas

**File:** `lib/validations/scoring.ts` (NEW)

```typescript
import { z } from "zod";

export const EvaluationAnswerSchema = z.object({
  nodeId: z.string().uuid(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  justification: z.string().optional(),
});

export const ScoringModelUpdateSchema = z.object({
  name: z.string().min(1),
  aggregationMethod: z.enum(["AVERAGE", "WEIGHTED_AVERAGE", "SUM", "MIN", "MAX"]),
  weightMode: z.enum(["RELATIVE", "ABSOLUTE", "NONE"]),
  scoreScale: z.enum(["0_100", "0_10", "1_5", "0_1"]),
});
```

---

## Lot 6: Frontend Refactor (3-5 days)

- [ ] Remove all mock data from components
- [ ] Connect to real APIs
- [ ] Refactor project form (add bank fields)
- [ ] Refactor evaluation form (navigation by domain)
- [ ] Create workflow visualization

### Template for API Connection

```typescript
// OLD - Mock data
const projects = MOCK_PROJECTS;

// NEW - API data
const [projects, setProjects] = useState([]);
useEffect(() => {
  fetchProjects();
}, []);

const fetchProjects = async () => {
  const res = await fetch("/api/projects", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (data.success) {
    setProjects(data.data);
  }
};
```

---

## Lot 7: Workflow & Audit (2-3 days)

- [ ] Workflow state machine
- [ ] Status transitions with permission checks
- [ ] Comment system with justifications
- [ ] Complete audit logging
- [ ] Approval workflow

---

## Lot 8: Reporting & Testing (2-3 days)

- [ ] Real PDF generation (use `pdfkit` or `puppeteer`)
- [ ] Real XLSX generation (use `xlsx`)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

---

## Execution Checklist

### Before Starting Each Lot
- [ ] Create new branch: `refactor/v7pp-5-[lot-name]`
- [ ] Run `npm run type-check` on current branch
- [ ] Run `npm run build` on current branch

### During Each Lot
- [ ] Commit frequently (don't do huge commits)
- [ ] Run `npm run type-check` after each feature
- [ ] Test manually before committing
- [ ] Update REFACTORING_PROGRESS.md

### After Each Lot
- [ ] Run full test suite: `npm run type-check && npm run build`
- [ ] Create pull request with detailed description
- [ ] Request code review (optional)
- [ ] Merge to main when ready

---

## Time Estimates

| Lot | Duration | Parallelizable |
|-----|----------|----------------|
| 2: API RBAC | 1-2 days | No - depends on Lot 1 |
| 3: DB | 2-3 days | No - depends on Lot 2 |
| 4: Scoring | 3-5 days | **YES** - can start with Lot 2 |
| 5: Backend | 2-3 days | Partially - overlaps with 4 |
| 6: Frontend | 3-5 days | **YES** - can work in parallel |
| 7: Workflow | 2-3 days | Depends on 3 |
| 8: Reporting | 2-3 days | Depends on 7 |

**Optimal Strategy:** Execute Lots 2-3 sequentially (critical path), then parallelize 4-6, then 7-8.

---

## Tips for Success

1. **Commit often** - Small, focused commits are easier to review
2. **Test after each feature** - Don't wait until end of Lot
3. **Document as you go** - Update markdown files with current status
4. **Ask for help** - If stuck, document the blocker and move on
5. **Keep security in mind** - Each new feature should pass security review
6. **Measure progress** - Update REFACTORING_PROGRESS.md regularly

---

**Last updated:** 2026-04-18  
**Status:** Ready for Lot 2 execution  
**Questions?** See REFACTORING_EXECUTIVE_SUMMARY.md
