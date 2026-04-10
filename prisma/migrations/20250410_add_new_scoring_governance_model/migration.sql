-- Add migration reference fields to legacy tables
ALTER TABLE "BP_PF_domains" ADD COLUMN "migratedToNodeId" TEXT;
ALTER TABLE "BP_PF_criteria" ADD COLUMN "migratedToNodeId" TEXT;

-- Create new scoring model tables
CREATE TABLE "BP_PF_v7pp_scoring_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "businessSegment" TEXT,
    "projectType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ownerBusinessId" TEXT,
    "ownerRiskId" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_models_ownerBusinessId_fkey" FOREIGN KEY ("ownerBusinessId") REFERENCES "BP_PF_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "BP_PF_v7pp_scoring_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "changeReason" TEXT,
    "releaseNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "validatedBy" TEXT,
    "publishedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_versions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BP_PF_v7pp_scoring_models" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "BP_PF_users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_versions_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "BP_PF_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_versions_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "BP_PF_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "BP_PF_v7pp_scoring_versions_modelId_versionNumber_key" ON "BP_PF_v7pp_scoring_versions"("modelId", "versionNumber");
CREATE INDEX "BP_PF_v7pp_scoring_versions_modelId_idx" ON "BP_PF_v7pp_scoring_versions"("modelId");
CREATE INDEX "BP_PF_v7pp_scoring_versions_status_idx" ON "BP_PF_v7pp_scoring_versions"("status");
CREATE INDEX "BP_PF_v7pp_scoring_versions_isPublished_idx" ON "BP_PF_v7pp_scoring_versions"("isPublished");

CREATE TABLE "BP_PF_v7pp_scoring_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "parentNodeId" TEXT,
    "nodeType" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "shortLabel" TEXT,
    "description" TEXT,
    "helpText" TEXT,
    "displayPath" TEXT,
    "depth" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "isScored" BOOLEAN NOT NULL DEFAULT false,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "allowsChildren" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION,
    "weightMode" TEXT DEFAULT 'RELATIVE',
    "aggregationMethod" TEXT,
    "answerType" TEXT,
    "scoringMethod" TEXT,
    "scoreMin" DOUBLE PRECISION,
    "scoreMax" DOUBLE PRECISION,
    "defaultValue" TEXT,
    "unit" TEXT,
    "currency" TEXT,
    "uiSchemaJson" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_nodes_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_nodes_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "BP_PF_v7pp_scoring_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "BP_PF_v7pp_scoring_nodes_versionId_code_key" ON "BP_PF_v7pp_scoring_nodes"("versionId", "code");
CREATE INDEX "BP_PF_v7pp_scoring_nodes_versionId_idx" ON "BP_PF_v7pp_scoring_nodes"("versionId");
CREATE INDEX "BP_PF_v7pp_scoring_nodes_parentNodeId_idx" ON "BP_PF_v7pp_scoring_nodes"("parentNodeId");
CREATE INDEX "BP_PF_v7pp_scoring_nodes_nodeType_idx" ON "BP_PF_v7pp_scoring_nodes"("nodeType");
CREATE INDEX "BP_PF_v7pp_scoring_nodes_isActive_idx" ON "BP_PF_v7pp_scoring_nodes"("isActive");
CREATE INDEX "BP_PF_v7pp_scoring_nodes_depth_idx" ON "BP_PF_v7pp_scoring_nodes"("depth");

CREATE TABLE "BP_PF_v7pp_scoring_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "code" TEXT,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "score" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "color" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_options_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "BP_PF_v7pp_scoring_options_nodeId_code_key" ON "BP_PF_v7pp_scoring_options"("nodeId", "code");
CREATE INDEX "BP_PF_v7pp_scoring_options_nodeId_idx" ON "BP_PF_v7pp_scoring_options"("nodeId");

CREATE TABLE "BP_PF_v7pp_scoring_ranges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "label" TEXT,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "minIncluded" BOOLEAN NOT NULL DEFAULT true,
    "maxIncluded" BOOLEAN NOT NULL DEFAULT true,
    "score" DOUBLE PRECISION,
    "color" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_ranges_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "BP_PF_v7pp_scoring_ranges_nodeId_idx" ON "BP_PF_v7pp_scoring_ranges"("nodeId");

CREATE TABLE "BP_PF_v7pp_scoring_formulas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL UNIQUE,
    "expression" TEXT NOT NULL,
    "variablesJson" TEXT,
    "minOutput" DOUBLE PRECISION,
    "maxOutput" DOUBLE PRECISION,
    "roundingMode" TEXT DEFAULT 'HALF_UP',
    "fallbackValue" DOUBLE PRECISION,
    "fallbackMessage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_formulas_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "BP_PF_v7pp_scoring_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT,
    "versionId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "conditionExpression" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "penaltyValue" DOUBLE PRECISION,
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "messageUser" TEXT,
    "messageCommittee" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_rules_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_rules_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "BP_PF_v7pp_scoring_rules_nodeId_idx" ON "BP_PF_v7pp_scoring_rules"("nodeId");
CREATE INDEX "BP_PF_v7pp_scoring_rules_versionId_idx" ON "BP_PF_v7pp_scoring_rules"("versionId");
CREATE INDEX "BP_PF_v7pp_scoring_rules_ruleType_idx" ON "BP_PF_v7pp_scoring_rules"("ruleType");

CREATE TABLE "BP_PF_v7pp_applicability_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "conditionExpression" TEXT NOT NULL,
    "effectType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_v7pp_applicability_rules_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "BP_PF_v7pp_applicability_rules_nodeId_idx" ON "BP_PF_v7pp_applicability_rules"("nodeId");

CREATE TABLE "BP_PF_v7pp_document_requirements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "allowedMimeTypes" TEXT,
    "maxFileSizeMb" INTEGER,
    "validationLevel" TEXT DEFAULT 'INFORMATIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_v7pp_document_requirements_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "BP_PF_v7pp_document_requirements_nodeId_idx" ON "BP_PF_v7pp_document_requirements"("nodeId");

CREATE TABLE "BP_PF_v7pp_scoring_evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'brouillon',
    "finalScore" DOUBLE PRECISION,
    "rating" TEXT,
    "recommendation" TEXT,
    "probabilityOfDefault" DOUBLE PRECISION,
    "malusTotal" DOUBLE PRECISION DEFAULT 0,
    "triggeredRulesJson" TEXT,
    "summaryJson" TEXT,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_evaluations_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BP_PF_v7pp_scoring_models" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_evaluations_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "BP_PF_v7pp_scoring_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_evaluations_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "BP_PF_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_projectId_idx" ON "BP_PF_v7pp_scoring_evaluations"("projectId");
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_modelId_idx" ON "BP_PF_v7pp_scoring_evaluations"("modelId");
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_modelVersionId_idx" ON "BP_PF_v7pp_scoring_evaluations"("modelVersionId");
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_analystId_idx" ON "BP_PF_v7pp_scoring_evaluations"("analystId");
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_status_idx" ON "BP_PF_v7pp_scoring_evaluations"("status");

CREATE TABLE "BP_PF_v7pp_evaluation_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "answerType" TEXT NOT NULL,
    "valueString" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueBoolean" BOOLEAN,
    "valueDate" TIMESTAMP(3),
    "valueJson" TEXT,
    "manualScore" DOUBLE PRECISION,
    "comment" TEXT,
    "sourceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_evaluation_answers_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_evaluation_answers_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "BP_PF_v7pp_evaluation_answers_evaluationId_nodeId_key" ON "BP_PF_v7pp_evaluation_answers"("evaluationId", "nodeId");
CREATE INDEX "BP_PF_v7pp_evaluation_answers_evaluationId_idx" ON "BP_PF_v7pp_evaluation_answers"("evaluationId");
CREATE INDEX "BP_PF_v7pp_evaluation_answers_nodeId_idx" ON "BP_PF_v7pp_evaluation_answers"("nodeId");

CREATE TABLE "BP_PF_v7pp_evaluation_node_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION,
    "weightedScore" DOUBLE PRECISION,
    "normalizedScore" DOUBLE PRECISION,
    "aggregationMethod" TEXT,
    "ruleImpactJson" TEXT,
    "explanation" TEXT,
    "traceJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_v7pp_evaluation_node_results_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_evaluation_node_results_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "BP_PF_v7pp_evaluation_node_results_evaluationId_nodeId_key" ON "BP_PF_v7pp_evaluation_node_results"("evaluationId", "nodeId");
CREATE INDEX "BP_PF_v7pp_evaluation_node_results_evaluationId_idx" ON "BP_PF_v7pp_evaluation_node_results"("evaluationId");
CREATE INDEX "BP_PF_v7pp_evaluation_node_results_nodeId_idx" ON "BP_PF_v7pp_evaluation_node_results"("nodeId");

CREATE TABLE "BP_PF_v7pp_change_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "modelId" TEXT,
    "versionId" TEXT,
    "evaluationId" TEXT,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValueJson" TEXT,
    "newValueJson" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    CONSTRAINT "BP_PF_v7pp_change_logs_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BP_PF_v7pp_scoring_models" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_change_logs_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_change_logs_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_change_logs_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "BP_PF_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "BP_PF_v7pp_change_logs_entityType_idx" ON "BP_PF_v7pp_change_logs"("entityType");
CREATE INDEX "BP_PF_v7pp_change_logs_entityId_idx" ON "BP_PF_v7pp_change_logs"("entityId");
CREATE INDEX "BP_PF_v7pp_change_logs_modelId_idx" ON "BP_PF_v7pp_change_logs"("modelId");
CREATE INDEX "BP_PF_v7pp_change_logs_versionId_idx" ON "BP_PF_v7pp_change_logs"("versionId");
CREATE INDEX "BP_PF_v7pp_change_logs_evaluationId_idx" ON "BP_PF_v7pp_change_logs"("evaluationId");
CREATE INDEX "BP_PF_v7pp_change_logs_changedBy_idx" ON "BP_PF_v7pp_change_logs"("changedBy");
CREATE INDEX "BP_PF_v7pp_change_logs_changedAt_idx" ON "BP_PF_v7pp_change_logs"("changedAt");
