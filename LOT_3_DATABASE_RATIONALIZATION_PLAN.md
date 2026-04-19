# Lot 3: Database Rationalization - Implementation Plan

**Date:** 2026-04-19  
**Status:** Planning Phase  
**Branch:** `claude/add-execution-tracking-MhV1u`

---

## Executive Summary

Lot 3 focuses on rationalizing the database schema to establish a single canonical scoring model (ScoringNode/ScoringModelVersion V7++) while preserving legacy data compatibility. This includes adding missing tables for workflow management, decision tracking, and audit trails.

---

## Current Database State

### Existing Models

**Canonical Scoring System (V7++)**
- ✅ `ScoringModel` - Scoring model families
- ✅ `ScoringModelVersion` - Governed versions
- ✅ `ScoringNode` - Hierarchical scoring structure
- ✅ `ScoringNodeOption` - Answer options
- ✅ `ScoringNodeRange` - Numeric ranges
- ✅ `ScoringNodeFormula` - Parameterized formulas
- ✅ `ScoringNodeRule` - Business rules (NO-GO, malus, warnings)
- ✅ `ScoringNodeApplicabilityRule` - Node visibility/applicability
- ✅ `ScoringNodeDataBinding` - Auto-fill and data linking
- ✅ `ScoringNodeDocumentRequirement` - Document tracking
- ✅ `ScoringEvaluation` - Individual scoring evaluations
- ✅ `ScoringEvaluationAnswer` - Captured answers
- ✅ `ScoringEvaluationNodeResult` - Calculated scores
- ✅ `ScoringChangeLog` - Audit trail

**Legacy Scoring System (Deprecated)**
- ⚠️ `ScoreDomain` - Legacy domain structure
- ⚠️ `ScoreCriterion` - Legacy criteria
- ⚠️ `ScoreOption` - Legacy options
- ⚠️ `ScoreRange` - Legacy ranges
- ⚠️ `Evaluation` - Legacy evaluation object
- ⚠️ `Scoring` - Legacy scoring calculation
- ⚠️ `EvaluationDomainScore` - Legacy domain scores
- ⚠️ `EvaluationAnswer` - Legacy answers
- ⚠️ `StressTestScenarioResult` - Legacy stress tests

**Core Business Models**
- ✅ `User` - Users with role-based access
- ✅ `Client` - Client information
- ✅ `Project` - Project/deal information
- ✅ `Country` - Country risk scores
- ✅ `SystemConfig` - System configuration

**Audit & Governance**
- ✅ `AuditLog` - Generic audit trail
- ✅ `ScoringAuditLog` - Scoring-specific audit
- ✅ `UserAuditLog` - User action audit

### Missing Models (To Create)

| Model | Purpose | Priority |
|-------|---------|----------|
| `ScoringWorkflow` | Multi-step evaluation workflow (DRAFT→SUBMITTED→REVIEWED→APPROVED) | 🔴 HIGH |
| `ScoringWorkflowStep` | Individual workflow steps | 🔴 HIGH |
| `ScoringDecision` | Final decision on evaluation | 🔴 HIGH |
| `ScoringOverride` | Override scores with audit trail | 🔴 HIGH |
| `ScoringDocument` | Uploaded documents for evaluation | 🟡 MEDIUM |
| `ScoringComment` | Comments/notes on evaluation | 🟡 MEDIUM |
| `ScoringApproval` | Approval/rejection tracking | 🟡 MEDIUM |

---

## Migration Strategy

### Phase 1: Add Missing Tables (No Data Deletion)

Create new tables without affecting existing data. Legacy tables remain readable.

```prisma
// New models to add:
- ScoringWorkflow
- ScoringWorkflowStep
- ScoringDecision
- ScoringOverride
- ScoringDocument
- ScoringComment
- ScoringApproval
```

### Phase 2: Data Migration (Gradual)

```
Legacy Evaluation → New ScoringEvaluation
Legacy Scoring → New ScoringEvaluationNodeResult
Legacy Answers → New ScoringEvaluationAnswer
Legacy Audit → New ScoringChangeLog
```

### Phase 3: Deprecate Legacy Tables

```
ScoreDomain → Deprecated (migration reference in ScoringNode)
ScoreCriterion → Deprecated (migration reference in ScoringNode)
ScoreOption → Deprecated (use ScoringNodeOption)
ScoreRange → Deprecated (use ScoringNodeRange)
Evaluation → Deprecated (use ScoringEvaluation)
Scoring → Deprecated (use ScoringEvaluationNodeResult)
EvaluationDomainScore → Deprecated (calculated from nodes)
EvaluationAnswer → Deprecated (use ScoringEvaluationAnswer)
StressTestScenarioResult → Deprecated (use ScoringEvaluationNodeResult)
```

---

## New Table Specifications

### 1. ScoringWorkflow

```prisma
model ScoringWorkflow {
  id                String                @id @default(uuid())
  evaluationId      String                @unique
  
  // Workflow state
  status            WorkflowStatus        @default(DRAFT)  // DRAFT, SUBMITTED, UNDER_REVIEW, REVIEWED, APPROVED, REJECTED
  currentStep       Int                   @default(0)
  
  // Workflow metadata
  requestedAt       DateTime?
  submittedAt       DateTime?
  submittedBy       String?
  reviewStartedAt   DateTime?
  reviewCompletedAt DateTime?
  approvedAt        DateTime?
  approvedBy        String?
  rejectedAt        DateTime?
  rejectedBy        String?
  
  // Workflow configuration
  requiresCommitteeApproval Boolean @default(false)
  requiresRiskManagerReview  Boolean @default(true)
  escalationReason  String?
  
  // Relationships
  evaluation        ScoringEvaluation     @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  steps             ScoringWorkflowStep[]
  decisions         ScoringDecision[]
  approvals         ScoringApproval[]
  comments          ScoringComment[]
  
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  
  @@unique([evaluationId])
  @@index([status])
  @@index([currentStep])
  @@map("BP_PF_v7pp_scoring_workflows")
}

enum WorkflowStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  REVIEWED
  APPROVED
  REJECTED
}
```

### 2. ScoringWorkflowStep

```prisma
model ScoringWorkflowStep {
  id                String                @id @default(uuid())
  workflowId        String
  
  // Step definition
  stepNumber        Int
  stepName          String
  stepType          String                // ANALYST_REVIEW, RISK_REVIEW, COMMITTEE_REVIEW, FINAL_APPROVAL
  description       String?
  
  // Step execution
  status            StepStatus            @default(PENDING)  // PENDING, IN_PROGRESS, COMPLETED, SKIPPED, FAILED
  startedAt         DateTime?
  completedAt       DateTime?
  dueDate           DateTime?
  
  // Assignee
  assignedTo        String?
  assignedBy        String?
  
  // Comments & notes
  notes             String?
  feedback          String?
  
  // Relationships
  workflow          ScoringWorkflow       @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  
  @@index([workflowId])
  @@index([stepNumber])
  @@index([status])
  @@map("BP_PF_v7pp_scoring_workflow_steps")
}

enum StepStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
  FAILED
}
```

### 3. ScoringDecision

```prisma
model ScoringDecision {
  id                String                @id @default(uuid())
  workflowId        String
  
  // Decision details
  decisionType      DecisionType          // APPROVE, APPROVE_WITH_CONDITIONS, CONDITIONAL_APPROVAL, REJECT
  riskRating        String                // AAA, AA, A, BBB, BB, B, CCC, D
  recommendation    String?
  justification     String
  
  // Conditions (if applicable)
  hasConditions     Boolean               @default(false)
  conditionsJson    String?               // JSON array of conditions
  
  // Decision maker
  decidedBy         String
  decidedAt         DateTime              @default(now())
  
  // Approval chain
  requiresHigherApproval Boolean          @default(false)
  escalatedTo       String?
  
  // Audit
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  
  // Relationships
  workflow          ScoringWorkflow       @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  decidedByUser     User                  @relation(fields: [decidedBy], references: [id], onDelete: Restrict)
  
  @@index([workflowId])
  @@index([decisionType])
  @@index([decidedAt])
  @@map("BP_PF_v7pp_scoring_decisions")
}

enum DecisionType {
  APPROVE
  APPROVE_WITH_CONDITIONS
  CONDITIONAL_APPROVAL
  REJECT
}
```

### 4. ScoringOverride

```prisma
model ScoringOverride {
  id                String                @id @default(uuid())
  evaluationId      String
  nodeId            String
  
  // Original vs Override
  originalValue     String?
  originalScore     Float?
  overriddenValue   String?
  overriddenScore   Float?
  
  // Override reason & justification
  reason            String
  justification     String?
  riskLevel         String                // LOW, MEDIUM, HIGH, CRITICAL
  
  // Override metadata
  overriddenBy      String
  overriddenAt      DateTime              @default(now())
  approvedBy        String?
  approvedAt        DateTime?
  
  // Audit trail
  auditNotes        String?
  changeLog         String?
  
  // Status
  status            OverrideStatus        @default(PENDING)  // PENDING, APPROVED, REJECTED, REVERTED
  
  // Relationships
  evaluation        ScoringEvaluation     @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  node              ScoringNode           @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  overriddenByUser  User                  @relation("OverridesBy", fields: [overriddenBy], references: [id])
  approvedByUser    User?                 @relation("OverridesApprovedBy", fields: [approvedBy], references: [id])
  
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  
  @@unique([evaluationId, nodeId])
  @@index([evaluationId])
  @@index([nodeId])
  @@index([status])
  @@map("BP_PF_v7pp_scoring_overrides")
}

enum OverrideStatus {
  PENDING
  APPROVED
  REJECTED
  REVERTED
}
```

### 5. ScoringDocument

```prisma
model ScoringDocument {
  id                String                @id @default(uuid())
  evaluationId      String
  
  // Document metadata
  fileName          String
  fileSize          Int
  fileType          String
  storagePath       String
  
  // Document classification
  documentType      String                // FINANCIAL_STATEMENT, TECHNICAL_SPEC, ENVIRONMENTAL_ASSESSMENT, etc.
  nodeId            String?               // Associated scoring node (if specific)
  isRequired        Boolean               @default(false)
  
  // Upload & verification
  uploadedBy        String
  uploadedAt        DateTime              @default(now())
  verifiedBy        String?
  verifiedAt        DateTime?
  
  // Audit
  description       String?
  notes             String?
  
  // Relationships
  evaluation        ScoringEvaluation     @relation(fields: [evaluationId], references: [id], onDelete: Cascade)
  node              ScoringNode?          @relation(fields: [nodeId], references: [id], onDelete: SetNull)
  uploadedByUser    User                  @relation("DocumentsUploadedBy", fields: [uploadedBy], references: [id])
  verifiedByUser    User?                 @relation("DocumentsVerifiedBy", fields: [verifiedBy], references: [id])
  
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  
  @@index([evaluationId])
  @@index([documentType])
  @@index([uploadedAt])
  @@map("BP_PF_v7pp_scoring_documents")
}
```

### 6. ScoringComment

```prisma
model ScoringComment {
  id                String                @id @default(uuid())
  workflowId        String
  
  // Comment content
  content           String
  commentType       String                @default("GENERAL")  // GENERAL, QUESTION, ISSUE, SUGGESTION
  
  // Author
  createdBy         String
  createdAt         DateTime              @default(now())
  
  // Reply chain
  parentCommentId   String?
  
  // Visibility
  isInternal        Boolean               @default(false)  // Internal review comments vs visible to analyst
  isResolved        Boolean               @default(false)
  resolvedAt        DateTime?
  resolvedBy        String?
  
  // Relationships
  workflow          ScoringWorkflow       @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  createdByUser     User                  @relation("CommentsCreatedBy", fields: [createdBy], references: [id])
  parentComment     ScoringComment?       @relation("CommentReplies", fields: [parentCommentId], references: [id], onDelete: Cascade)
  replies           ScoringComment[]      @relation("CommentReplies")
  
  updatedAt         DateTime              @updatedAt
  
  @@index([workflowId])
  @@index([createdAt])
  @@index([isResolved])
  @@map("BP_PF_v7pp_scoring_comments")
}
```

### 7. ScoringApproval

```prisma
model ScoringApproval {
  id                String                @id @default(uuid())
  workflowId        String
  
  // Approval details
  approvalType      ApprovalType          // ANALYST_SIGN_OFF, RISK_MANAGER_REVIEW, COMMITTEE_APPROVAL, FINAL_APPROVAL
  status            ApprovalStatus        @default(PENDING)  // PENDING, APPROVED, REJECTED, ESCALATED
  
  // Approver
  requestedFrom     String                // User role or specific user
  approvedBy        String?
  approvedAt        DateTime?
  
  // Decision
  comments          String?
  signature         String?               // Digital signature or approval token
  
  // Audit trail
  emailSentAt       DateTime?
  reminderSentAt    DateTime?
  dueDate           DateTime?
  
  // Relationships
  workflow          ScoringWorkflow       @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  approvedByUser    User?                 @relation(fields: [approvedBy], references: [id], onDelete: SetNull)
  
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  
  @@index([workflowId])
  @@index([status])
  @@index([dueDate])
  @@map("BP_PF_v7pp_scoring_approvals")
}

enum ApprovalType {
  ANALYST_SIGN_OFF
  RISK_MANAGER_REVIEW
  COMMITTEE_APPROVAL
  FINAL_APPROVAL
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  ESCALATED
}
```

---

## Implementation Phases

### Phase 1: Create New Tables (1-2 hours)
1. Create migration file with new models
2. Add relationships to existing models
3. Create indexes for performance
4. Test migration on dev database

### Phase 2: Add Relationships (1 hour)
1. Update User model with relationships to new tables
2. Update ScoringEvaluation with workflow relationships
3. Update ScoringNode with override relationships
4. Create database indexes

### Phase 3: Data Migration Script (2-3 hours)
1. Migrate legacy Evaluation → ScoringEvaluation
2. Migrate legacy Scoring → ScoringEvaluationNodeResult
3. Initialize workflows for existing evaluations
4. Verify data integrity

### Phase 4: Deprecation Warnings (1 hour)
1. Add deprecation comments to legacy models
2. Update documentation
3. Create migration guide for clients

---

## Database Schema Changes Summary

**New Tables:** 7
- ScoringWorkflow
- ScoringWorkflowStep
- ScoringDecision
- ScoringOverride
- ScoringDocument
- ScoringComment
- ScoringApproval

**Modified Tables:** 2
- ScoringEvaluation (add workflow relationships)
- User (add relationships to new tables)

**Deprecated Tables:** 9 (preserved for backward compatibility)
- ScoreDomain
- ScoreCriterion
- ScoreOption
- ScoreRange
- Evaluation
- Scoring
- EvaluationDomainScore
- EvaluationAnswer
- StressTestScenarioResult

**Total Database Growth:**
- New tables: ~7
- New relationships: ~15
- New indexes: ~20
- Migration data: Automated

---

## Rollback Plan

Each migration includes:
- Reversible SQL (create + drop scripts)
- Backup of migrated data
- Validation checks before/after
- Test migration on separate database

```sql
-- Forward: Create new tables
prisma migrate dev --name add_workflow_and_decision_tables

-- Backward: Drop new tables (if needed)
prisma migrate resolve --rolled-back
```

---

## Success Criteria

✅ All 7 new tables created  
✅ Relationships properly defined  
✅ No data loss from legacy tables  
✅ Indexes created for performance  
✅ TypeScript types generated  
✅ Database validates on dev  
✅ API endpoints updated  
✅ Build succeeds without errors  

---

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Create new tables | 1-2 hrs | ⏳ TODO |
| 2. Add relationships | 1 hr | ⏳ TODO |
| 3. Data migration | 2-3 hrs | ⏳ TODO |
| 4. Deprecation warnings | 1 hr | ⏳ TODO |
| **Total** | **5-7 hrs** | ⏳ TODO |

**Estimated Completion:** Today (2-3 hours priority items)

---

## Next Actions

1. ✅ Review and approve schema changes
2. Create migration file with new models
3. Update Prisma schema.prisma with new tables
4. Generate Prisma Client
5. Create migration script for legacy data
6. Update API endpoints for new workflow system
7. Test on development database

---

**Prepared by:** Claude AI  
**Date:** 2026-04-19  
**Status:** Ready for Implementation

