# PF Scoring V7++ - Architecture Overview

## For Junior Developers

This document provides a **high-level overview** of the entire PF Scoring system. Use this as your map to understand the codebase.

---

## What Is PF Scoring V7++?

A **web application that evaluates projects** against banking standards (Basel, IFC, EBRD, Bank Al-Maghrib).

**In 30 seconds:**
1. Analyst logs in
2. Analyst creates an evaluation for a project
3. Analyst answers questions about the project
4. System calculates a score (0-100)
5. System assigns a rating (AAA-D)
6. Senior analyst approves or rejects

---

## System Components

### 1. Frontend (User Interface)

**Where:** `/app` directory (Next.js App Router)

**Key Pages:**
- `/dashboard` - Overview of projects and evaluations
- `/projects` - List and manage projects
- `/projects/[id]` - Project details
- `/methodology` - Explain scoring methods
- `/audit` - View user action history

**Tech Stack:**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS + shadcn/ui
- **State:** Server components (default), client components with `"use client"` when needed

**Key Insight:** Most components are server components. Use client components only for interactivity (forms, buttons, modals).

### 2. Backend (APIs)

**Where:** `/app/api` directory (API routes)

**Pattern:** Follows RESTful conventions

```
GET    /api/projects              - List projects
GET    /api/projects/[id]         - Get project
PUT    /api/projects/[id]         - Update project
DELETE /api/projects/[id]         - Delete project

GET    /api/evaluations           - List evaluations
POST   /api/evaluations           - Create evaluation
GET    /api/evaluations/[id]      - Get evaluation
POST   /api/evaluations/[id]      - Submit/approve/reject

GET    /api/users                 - List users
POST   /api/users/[id]/deactivate - Deactivate user
```

**Key Insight:** All APIs go through `/api/admin/scoring/` or `/api/` paths. Check `withAuth` middleware for authentication.

### 3. Database (PostgreSQL + Prisma)

**Where:** `/prisma/schema.prisma` (database schema)

**Main Models:**

```
Projects
  └─ Evaluations
     ├─ Answers (what analyst answered)
     └─ Node Results (calculated scores)

Scoring Models (configuration)
  └─ ScoringNodes (hierarchy of questions)
     ├─ Options (choices for multiple-choice)
     ├─ Ranges (numeric ranges)
     ├─ Rules (penalties, disqualifiers)
     └─ Formulas (complex calculations)

Users
  └─ Audit Logs (history of user actions)
```

**Key Insight:** Prefix all your references with `prisma.modelName` to query the database.

### 4. Business Logic (Services)

**Where:** `/lib/services` directory

**Key Services:**

| Service | Purpose |
|---------|---------|
| `ScoringEvaluationService` | Create evaluations, record answers, submit for scoring |
| `ScoringEngine` | Calculate scores recursively (the math) |
| `GenericScoringEngine` | Alternative, fully parameterized engine |
| `UserManagementService` | Create/deactivate users, manage roles, audit logging |

**Pattern:** All services are classes with static methods. No instantiation needed.

```typescript
// Example usage
const evaluation = await ScoringEvaluationService.createEvaluation({
  projectId: '...',
  modelVersionId: '...',
  evaluatedBy: '...'
});

const user = await UserManagementService.getUserById(userId);
```

---

## How the System Works: Step by Step

### Scenario: Analyst Evaluates a Project

```
1. SETUP
   └─ Admin creates ScoringModel (questionnaire template)
      └─ Admin creates ScoringNodes (questions, options, rules)

2. ANALYST CREATES EVALUATION
   POST /api/admin/scoring/evaluations
   {
     "projectId": "proj-123",
     "modelVersionId": "v7-001",
     "evaluatedBy": "analyst-456"
   }
   ✓ ScoringEvaluation created with status="brouillon"

3. ANALYST ANSWERS QUESTIONS
   POST /api/admin/scoring/evaluations/[id]/answers
   {
     "nodeId": "q-001",
     "valueString": "Low Risk"
   }
   ✓ ScoringEvaluationAnswer recorded

4. ANALYST SUBMITS EVALUATION
   POST /api/admin/scoring/evaluations/[id]
   { "action": "submit" }
   
   ✓ Triggers scoring calculation:
      1. ScoringEvaluationService.submitEvaluation()
      2. Calls ScoringEngine.scoreEvaluation()
         a. Load all ScoringNodes
         b. Load all answers
         c. Build tree structure
         d. Score leaves (based on answer + scoringMethod)
         e. Aggregate upward (based on aggregationMethod)
         f. Apply rules (penalties for NO-GO, MALUS)
         g. Store results per node
         h. Calculate final score
         i. Determine rating (AAA-D)
      3. Update evaluation with finalScore, rating
      4. Status changes to "soumis"

5. SENIOR ANALYST REVIEWS
   GET /api/admin/scoring/evaluations/[id]
   ✓ Can see:
      - finalScore: 78
      - rating: "A"
      - nodeResults: [detailed breakdown]

6. SENIOR ANALYST APPROVES
   POST /api/admin/scoring/evaluations/[id]
   { "action": "approve" }
   ✓ Status changes to "valide"
```

---

## Key Concepts

### Hierarchical Scoring

Projects are scored in a **tree structure**:

```
Risque Financier (parent, aggregates children)
├─ Liquidité (parent, aggregates children)
│  ├─ Current Ratio (leaf, scored from answer)
│  └─ Quick Ratio (leaf, scored from answer)
└─ Levier (parent, aggregates children)
   ├─ Debt/Equity (leaf, scored from answer)
   └─ Debt/EBITDA (leaf, scored from answer)
```

**Scoring Flow:**
1. Analyst answers leaf questions
2. Each leaf gets a score based on answer
3. Parent nodes aggregate their children
4. Final score combines all root nodes

### Scoring Methods

Different node types score answers differently:

| Method | Used When | Example |
|--------|-----------|---------|
| OPTION_SCORE | Multiple choice | "Risk Level: Low/Medium/High" |
| RANGE_SCORE | Numeric ranges | "Current Ratio > 2.0: 90 pts" |
| NUMERIC_DIRECT | Direct number | "Financial Health (0-100)" |
| MANUAL_SCORE | Analyst inputs | Analyst manually assigns score |
| FORMULA | Complex calc | Future: needs expression parser |

### Aggregation Methods

Parent nodes combine children using these methods:

| Method | Formula | Use Case |
|--------|---------|----------|
| WEIGHTED_AVERAGE | Σ(score × weight) / Σweight | Different importance |
| SIMPLE_AVERAGE | Σscore / count | Equal importance |
| SUM | Σscore | Accumulating metrics |
| MIN | min(scores) | Safety criteria |
| MAX | max(scores) | Opportunity criteria |

### Rules Engine

Three types of rules affect scores:

| Rule | Trigger | Impact | Example |
|------|---------|--------|---------|
| NO-GO | Disqualifying | Heavy penalty | License missing → -100 |
| MALUS | Problem detected | Moderate penalty | Negative cash flow → -15 |
| WARNING | FYI only | No penalty | First-time borrower |

---

## Database Relationships

### Core Evaluation Flow

```
Project
  ├─ Evaluations (multiple evaluations of same project)
     ├─ ScoringEvaluation
     │  ├─ ScoringEvaluationAnswer[] (user responses)
     │  └─ ScoringEvaluationNodeResult[] (calculated scores)
     │
     └─ References
        ├─ ScoringModel (questionnaire template)
        │  └─ ScoringModelVersion
        │     └─ ScoringNode[] (hierarchical questions)
        │        ├─ ScoringNodeOption[] (choices)
        │        ├─ ScoringNodeRange[] (numeric ranges)
        │        ├─ ScoringNodeRule[] (penalties)
        │        └─ ScoringNodeFormula[] (calculations)
        │
        └─ User (analyst who created it)
           └─ UserAuditLog[] (action history)
```

### Audit & Compliance

```
User
  ├─ Actions on self (login, password change)
  └─ UserAuditLog[] (audit trail)
     └─ Contains:
        - Who (userId)
        - What (action: DEACTIVATE, ROLE_CHANGE, etc.)
        - When (createdAt)
        - Why (reason)
        - Where (ipAddress, userAgent)
        - Before/After (oldValue, newValue)
```

---

## Deployment Models

### Development

```
Local Machine
  └─ npm run dev
     ├─ Frontend: http://localhost:3000
     ├─ Database: Local PostgreSQL
     └─ TABLE_PREFIX: DEV
```

### Staging

```
Vercel + Supabase
  └─ Staging environment
     ├─ Frontend: staging.pf-scoring.vercel.app
     ├─ Database: Supabase staging DB
     └─ TABLE_PREFIX: STAGING
```

### Production

```
Vercel + Supabase
  └─ Production environment
     ├─ Frontend: pf-scoring.vercel.app
     ├─ Database: Supabase production DB
     └─ TABLE_PREFIX: PROD
```

**Key Insight:** Different prefixes allow same code to run against different databases. See `/docs/MULTI_DEPLOYMENT.md`.

---

## Authentication & Authorization

### Flow

```
User visits app
  ├─ Supabase Auth middleware checks session
  ├─ If not logged in → redirect to /auth/login
  └─ If logged in:
     ├─ Load user from database
     ├─ Check user.isActive
     ├─ Check user.role (ADMIN, ANALYST, APPROVER, VIEWER)
     └─ Grant/deny access based on route permissions
```

### Where to Check

- **Auth middleware:** `/lib/auth-middleware.ts`
- **User model:** `User` in `/prisma/schema.prisma`
- **Example:** `/app/api/admin/scoring/evaluations/[id]/answers/route.ts` uses `withAuth` wrapper

---

## Files You'll Work With Most

### Frontend

| File | Purpose | When to Edit |
|------|---------|--------------|
| `/app/projects/page.tsx` | Projects list | Add project filters |
| `/app/projects/[id]/page.tsx` | Project detail | Show more info |
| `/components/` | Reusable components | Create new UI elements |

### Backend

| File | Purpose | When to Edit |
|------|---------|--------------|
| `/app/api/projects/route.ts` | Projects API | Change project endpoints |
| `/app/api/evaluations/[id]/route.ts` | Evaluation API | Change evaluation endpoints |
| `/lib/services/` | Business logic | Add calculations, rules |

### Database

| File | Purpose | When to Edit |
|------|---------|--------------|
| `/prisma/schema.prisma` | Data structure | Add new fields/models |
| `/prisma/schema.template.prisma` | Prefix template | Auto-generated, don't edit |
| `/prisma/migrations/` | Schema changes | Auto-generated, review before committing |

---

## Common Tasks

### Add a New Evaluation Field

**Scenario:** Need to track "loan purpose" in evaluations.

1. **Update schema**
   ```prisma
   // prisma/schema.prisma
   model ScoringEvaluation {
     // ... existing fields
     loanPurpose  String?
   }
   ```

2. **Create migration**
   ```bash
   npx prisma migrate dev --name add_loan_purpose
   ```

3. **Update service**
   ```typescript
   // lib/services/scoring-evaluation-service.ts
   static async createEvaluation(data: {
     // ... existing
     loanPurpose?: string;
   }) {
     // ... existing
     data: {
       // ... existing
       loanPurpose: data.loanPurpose,
     }
   }
   ```

4. **Update API**
   ```typescript
   // app/api/admin/scoring/evaluations/route.ts
   const body = await request.json();
   const { loanPurpose } = body;
   // Pass to service
   ```

5. **Test**
   ```bash
   npm run dev
   # Test via API or UI
   ```

### Add a Scoring Rule

**Scenario:** "Debt > 5x EBITDA should be NO-GO"

1. **Create rule via admin UI** (or database)
   ```typescript
   await prisma.scoringNodeRule.create({
     data: {
       nodeId: 'debtRatioNode',
       code: 'DEBT_5X_EBITDA',
       ruleType: 'NO-GO',
       severity: 'CRITICAL',
       penaltyValue: -100,
       messageUser: 'Debt exceeds 5x EBITDA - disqualifying'
     }
   });
   ```

2. **Update rule evaluation logic**
   ```typescript
   // lib/services/scoring-engine.ts
   if (rule.ruleType === "NO-GO" && nodeScore.rawScore < 25) {
     // Triggered
   }
   ```

3. **Test**
   - Create evaluation with rule-triggering answer
   - Submit evaluation
   - Verify score is penalized

### Add User Role

**Scenario:** Need new role "SUPERVISOR"

1. **Update Prisma enum**
   ```prisma
   enum UserRole {
     ADMIN
     ANALYST
     APPROVER
     VIEWER
     SUPERVISOR  // NEW
   }
   ```

2. **Create migration**
   ```bash
   npx prisma migrate dev --name add_supervisor_role
   ```

3. **Update authorization**
   ```typescript
   // lib/auth-middleware.ts
   const allowedRoles = ['ADMIN', 'SUPERVISOR'];
   if (!allowedRoles.includes(user.role)) {
     // Deny
   }
   ```

4. **Test**
   - Create user with SUPERVISOR role
   - Verify they can access SUPERVISOR features

---

## Debugging Tips

### "Score not calculating"

Check these in order:

1. **Evaluation status**
   ```sql
   SELECT id, status, finalScore FROM pf_v7pp_scoring_evaluations WHERE id = '...';
   ```

2. **Answers exist**
   ```sql
   SELECT count(*) FROM pf_v7pp_scoring_evaluation_answers 
   WHERE evaluationId = '...';
   ```

3. **Node results exist**
   ```sql
   SELECT count(*) FROM pf_v7pp_evaluation_node_results 
   WHERE evaluationId = '...';
   ```

4. **Check logs**
   ```bash
   # Terminal running npm run dev
   # Look for [Scoring] log messages
   ```

### "Wrong table prefix"

Check your `.env`:

```bash
echo $TABLE_PREFIX  # Should match table name start

# Regenerate schema
npm run schema:generate

# Verify
grep "@@map" prisma/schema.prisma | head -3
```

### "User can't access page"

Check authentication:

1. **Is user logged in?**
   ```typescript
   // In your API route
   console.log(user);  // Should not be undefined
   ```

2. **Is user active?**
   ```sql
   SELECT id, email, isActive, role FROM pf_v7pp_users WHERE email = '...';
   ```

3. **Does role have permission?**
   ```typescript
   // Check /lib/auth-middleware.ts role checks
   ```

---

## Running Tests

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Format (check)
npm run format:check

# Format (write)
npm run format

# Build
npm run build
```

---

## Related Documentation

- **Detailed Scoring System:** `/docs/SCORING_SYSTEM.md`
- **User Management:** `/docs/USER_MANAGEMENT.md`
- **Multi-Deployment:** `/docs/MULTI_DEPLOYMENT.md`
- **Table Prefix Strategy:** `/docs/TABLE_PREFIX_STRATEGY.md`
- **API Documentation:** (TODO - in API routes)

---

## Tech Stack Reference

| Layer | Technology | Docs |
|-------|-----------|------|
| Frontend | Next.js 15 | https://nextjs.org |
| Styling | TailwindCSS | https://tailwindcss.com |
| UI Components | shadcn/ui | https://ui.shadcn.com |
| Language | TypeScript | https://www.typescriptlang.org |
| Database | PostgreSQL | https://www.postgresql.org |
| ORM | Prisma | https://www.prisma.io |
| Auth | Supabase Auth | https://supabase.com |
| Hosting | Vercel | https://vercel.com |

---

## Quick Start

```bash
# 1. Clone repo
git clone ...
cd pf-scoring-v7claude

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# 4. Run migrations
npx prisma migrate dev

# 5. Start dev server
npm run dev

# 6. Open browser
open http://localhost:3000
```

---

## Need Help?

- **Code questions:** Ask a senior developer or review related code
- **Database questions:** Check `prisma/schema.prisma` and migrations
- **API questions:** Look at similar endpoints in `/app/api`
- **Styling questions:** Check existing components in `/components`

Good luck! 🚀

