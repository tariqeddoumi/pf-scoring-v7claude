-- =====================================================================
-- Migration: Add Workflow, Decision, Override, Document, Comment, Approval tables
-- Date: 2026-04-19
-- Context: Lot 3 Phase 1 - Banking-grade workflow & decision management
-- Fixed: Correct type matching (UUID for users, TEXT for scoring tables)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ScoringWorkflow — one-to-one with ScoringEvaluation
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_workflows" (
    "id"                          TEXT NOT NULL PRIMARY KEY,
    "evaluationId"                TEXT NOT NULL,

    "status"                      TEXT NOT NULL DEFAULT 'DRAFT',
    "currentStep"                 INTEGER NOT NULL DEFAULT 0,

    "requestedAt"                 TIMESTAMP(3),
    "submittedAt"                 TIMESTAMP(3),
    "submittedBy"                 UUID,
    "reviewStartedAt"             TIMESTAMP(3),
    "reviewCompletedAt"           TIMESTAMP(3),
    "approvedAt"                  TIMESTAMP(3),
    "approvedBy"                  UUID,
    "rejectedAt"                  TIMESTAMP(3),
    "rejectedBy"                  UUID,

    "requiresCommitteeApproval"   BOOLEAN NOT NULL DEFAULT false,
    "requiresRiskManagerReview"   BOOLEAN NOT NULL DEFAULT true,
    "escalationReason"            TEXT,

    "createdAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_workflows_evaluationId_key" UNIQUE ("evaluationId"),
    CONSTRAINT "BP_PF_v7pp_scoring_workflows_evaluationId_fkey"
        FOREIGN KEY ("evaluationId")
        REFERENCES "BP_PF_v7pp_scoring_evaluations"("id")
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_workflows_status_idx"      ON "BP_PF_v7pp_scoring_workflows"("status");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_workflows_currentStep_idx" ON "BP_PF_v7pp_scoring_workflows"("currentStep");

-- ---------------------------------------------------------------------
-- 2. ScoringWorkflowStep — steps inside a workflow
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_workflow_steps" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "workflowId"  TEXT NOT NULL,

    "stepNumber"  INTEGER NOT NULL,
    "stepName"    TEXT NOT NULL,
    "stepType"    TEXT NOT NULL,
    "description" TEXT,

    "status"      TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt"   TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dueDate"     TIMESTAMP(3),

    "assignedTo"  UUID,
    "assignedBy"  UUID,
    "notes"       TEXT,
    "feedback"    TEXT,

    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_scoring_workflow_steps_workflowId_fkey"
        FOREIGN KEY ("workflowId")
        REFERENCES "BP_PF_v7pp_scoring_workflows"("id")
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_workflow_steps_workflowId_idx"  ON "BP_PF_v7pp_scoring_workflow_steps"("workflowId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_workflow_steps_stepNumber_idx"  ON "BP_PF_v7pp_scoring_workflow_steps"("stepNumber");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_workflow_steps_status_idx"      ON "BP_PF_v7pp_scoring_workflow_steps"("status");

-- ---------------------------------------------------------------------
-- 3. ScoringDecision — final decision on a workflow
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_decisions" (
    "id"                     TEXT NOT NULL PRIMARY KEY,
    "workflowId"             TEXT NOT NULL,

    "decisionType"           TEXT NOT NULL,
    "riskRating"             TEXT NOT NULL,
    "recommendation"         TEXT,
    "justification"          TEXT NOT NULL,

    "hasConditions"          BOOLEAN NOT NULL DEFAULT false,
    "conditionsJson"         TEXT,

    "decidedBy"              UUID NOT NULL,
    "decidedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "requiresHigherApproval" BOOLEAN NOT NULL DEFAULT false,
    "escalatedTo"            UUID,

    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_scoring_decisions_workflowId_fkey"
        FOREIGN KEY ("workflowId")
        REFERENCES "BP_PF_v7pp_scoring_workflows"("id")
        ON DELETE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_decisions_decidedBy_fkey"
        FOREIGN KEY ("decidedBy")
        REFERENCES "BP_PF_users"("id")
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_decisions_workflowId_idx"    ON "BP_PF_v7pp_scoring_decisions"("workflowId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_decisions_decisionType_idx"  ON "BP_PF_v7pp_scoring_decisions"("decisionType");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_decisions_decidedAt_idx"     ON "BP_PF_v7pp_scoring_decisions"("decidedAt");

-- ---------------------------------------------------------------------
-- 4. ScoringOverride — score overrides with audit trail
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_overrides" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "evaluationId"    TEXT NOT NULL,
    "nodeId"          TEXT NOT NULL,

    "originalValue"   TEXT,
    "originalScore"   DOUBLE PRECISION,
    "overriddenValue" TEXT,
    "overriddenScore" DOUBLE PRECISION,

    "reason"          TEXT NOT NULL,
    "justification"   TEXT,
    "riskLevel"       TEXT NOT NULL,

    "overriddenBy"    UUID NOT NULL,
    "overriddenAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy"      UUID,
    "approvedAt"      TIMESTAMP(3),

    "auditNotes"      TEXT,
    "changeLog"       TEXT,
    "status"          TEXT NOT NULL DEFAULT 'PENDING',

    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_scoring_overrides_evaluationId_nodeId_key" UNIQUE ("evaluationId", "nodeId"),
    CONSTRAINT "BP_PF_v7pp_scoring_overrides_evaluationId_fkey"
        FOREIGN KEY ("evaluationId")
        REFERENCES "BP_PF_v7pp_scoring_evaluations"("id")
        ON DELETE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_overrides_nodeId_fkey"
        FOREIGN KEY ("nodeId")
        REFERENCES "BP_PF_v7pp_scoring_nodes"("id")
        ON DELETE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_overrides_overriddenBy_fkey"
        FOREIGN KEY ("overriddenBy")
        REFERENCES "BP_PF_users"("id"),
    CONSTRAINT "BP_PF_v7pp_scoring_overrides_approvedBy_fkey"
        FOREIGN KEY ("approvedBy")
        REFERENCES "BP_PF_users"("id")
);

CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_overrides_evaluationId_idx" ON "BP_PF_v7pp_scoring_overrides"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_overrides_nodeId_idx"       ON "BP_PF_v7pp_scoring_overrides"("nodeId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_overrides_status_idx"       ON "BP_PF_v7pp_scoring_overrides"("status");

-- ---------------------------------------------------------------------
-- 5. ScoringDocument — documents uploaded for an evaluation
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_documents" (
    "id"           TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,

    "fileName"     TEXT NOT NULL,
    "fileSize"     INTEGER NOT NULL,
    "fileType"     TEXT NOT NULL,
    "storagePath"  TEXT NOT NULL,

    "documentType" TEXT NOT NULL,
    "nodeId"       TEXT,
    "isRequired"   BOOLEAN NOT NULL DEFAULT false,

    "uploadedBy"   UUID NOT NULL,
    "uploadedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedBy"   UUID,
    "verifiedAt"   TIMESTAMP(3),

    "description"  TEXT,
    "notes"        TEXT,

    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_scoring_documents_evaluationId_fkey"
        FOREIGN KEY ("evaluationId")
        REFERENCES "BP_PF_v7pp_scoring_evaluations"("id")
        ON DELETE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_documents_nodeId_fkey"
        FOREIGN KEY ("nodeId")
        REFERENCES "BP_PF_v7pp_scoring_nodes"("id")
        ON DELETE SET NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_documents_uploadedBy_fkey"
        FOREIGN KEY ("uploadedBy")
        REFERENCES "BP_PF_users"("id"),
    CONSTRAINT "BP_PF_v7pp_scoring_documents_verifiedBy_fkey"
        FOREIGN KEY ("verifiedBy")
        REFERENCES "BP_PF_users"("id")
);

CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_documents_evaluationId_idx" ON "BP_PF_v7pp_scoring_documents"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_documents_documentType_idx" ON "BP_PF_v7pp_scoring_documents"("documentType");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_documents_uploadedAt_idx"   ON "BP_PF_v7pp_scoring_documents"("uploadedAt");

-- ---------------------------------------------------------------------
-- 6. ScoringComment — comments and discussions on workflows
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_comments" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "workflowId"      TEXT NOT NULL,

    "content"         TEXT NOT NULL,
    "commentType"     TEXT NOT NULL DEFAULT 'GENERAL',

    "createdBy"       UUID NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "parentCommentId" TEXT,

    "isInternal"      BOOLEAN NOT NULL DEFAULT false,
    "isResolved"      BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt"      TIMESTAMP(3),
    "resolvedBy"      UUID,

    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_scoring_comments_workflowId_fkey"
        FOREIGN KEY ("workflowId")
        REFERENCES "BP_PF_v7pp_scoring_workflows"("id")
        ON DELETE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_comments_createdBy_fkey"
        FOREIGN KEY ("createdBy")
        REFERENCES "BP_PF_users"("id"),
    CONSTRAINT "BP_PF_v7pp_scoring_comments_parentCommentId_fkey"
        FOREIGN KEY ("parentCommentId")
        REFERENCES "BP_PF_v7pp_scoring_comments"("id")
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_comments_workflowId_idx"  ON "BP_PF_v7pp_scoring_comments"("workflowId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_comments_createdAt_idx"   ON "BP_PF_v7pp_scoring_comments"("createdAt");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_comments_isResolved_idx"  ON "BP_PF_v7pp_scoring_comments"("isResolved");

-- ---------------------------------------------------------------------
-- 7. ScoringApproval — approval chain entries
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_approvals" (
    "id"             TEXT NOT NULL PRIMARY KEY,
    "workflowId"     TEXT NOT NULL,

    "approvalType"   TEXT NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'PENDING',

    "requestedFrom"  TEXT NOT NULL,
    "approvedBy"     UUID,
    "approvedAt"     TIMESTAMP(3),

    "comments"       TEXT,
    "signature"      TEXT,

    "emailSentAt"    TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "dueDate"        TIMESTAMP(3),

    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_scoring_approvals_workflowId_fkey"
        FOREIGN KEY ("workflowId")
        REFERENCES "BP_PF_v7pp_scoring_workflows"("id")
        ON DELETE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_approvals_approvedBy_fkey"
        FOREIGN KEY ("approvedBy")
        REFERENCES "BP_PF_users"("id")
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_approvals_workflowId_idx" ON "BP_PF_v7pp_scoring_approvals"("workflowId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_approvals_status_idx"     ON "BP_PF_v7pp_scoring_approvals"("status");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_approvals_dueDate_idx"    ON "BP_PF_v7pp_scoring_approvals"("dueDate");
