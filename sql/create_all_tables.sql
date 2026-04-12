-- ============================================================================
-- CREATE ALL TABLES FROM PRISMA SCHEMA
-- Crée TOUTES les tables correspondant au schéma Prisma complet
-- Created: 2026-04-12
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\echo '================================================================================'
\echo '                 CREATING ALL DATABASE TABLES'
\echo '================================================================================'
\echo ''

-- ============================================================================
-- SECTION 1: CORE TABLES
-- ============================================================================

\echo 'Creating core tables...'

-- Users table
CREATE TABLE IF NOT EXISTS "BP_PF_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'analyst',
    "oauthProvider" TEXT,
    "oauthId" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_users_email_key" UNIQUE("email")
);
CREATE INDEX IF NOT EXISTS "BP_PF_users_email_idx" ON "BP_PF_users"("email");

-- Clients table
CREATE TABLE IF NOT EXISTS "BP_PF_clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT UNIQUE,
    "telephone" TEXT,
    "secteur" TEXT,
    "pays" TEXT,
    "type" TEXT DEFAULT 'Entreprise',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_clients_email_key" UNIQUE("email")
);
CREATE INDEX IF NOT EXISTS "BP_PF_clients_email_idx" ON "BP_PF_clients"("email");
CREATE INDEX IF NOT EXISTS "BP_PF_clients_status_idx" ON "BP_PF_clients"("status");

-- Projects table
CREATE TABLE IF NOT EXISTS "BP_PF_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'MAD',
    "status" TEXT NOT NULL DEFAULT 'brouillon',
    "scoreGlobal" DOUBLE PRECISION,
    "grade" TEXT,
    "creePar" TEXT NOT NULL,
    "countryCode" TEXT,
    "clientId" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_projects_creePar_fkey" FOREIGN KEY ("creePar") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BP_PF_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_projects_creePar_idx" ON "BP_PF_projects"("creePar");
CREATE INDEX IF NOT EXISTS "BP_PF_projects_clientId_idx" ON "BP_PF_projects"("clientId");
CREATE INDEX IF NOT EXISTS "BP_PF_projects_status_idx" ON "BP_PF_projects"("status");
CREATE INDEX IF NOT EXISTS "BP_PF_projects_secteur_idx" ON "BP_PF_projects"("secteur");

\echo 'Created: BP_PF_users, BP_PF_clients, BP_PF_projects ✓'

-- ============================================================================
-- SECTION 2: LEGACY SCORING TABLES
-- ============================================================================

\echo 'Creating legacy scoring tables...'

-- ScoreDomain table (legacy)
CREATE TABLE IF NOT EXISTS "BP_PF_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.125,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "migratedToNodeId" TEXT
);
CREATE INDEX IF NOT EXISTS "BP_PF_domains_code_idx" ON "BP_PF_domains"("code");
CREATE INDEX IF NOT EXISTS "BP_PF_domains_isActive_idx" ON "BP_PF_domains"("isActive");

-- ScoreCriterion table (legacy)
CREATE TABLE IF NOT EXISTS "BP_PF_criteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OPTION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hardStopIfBelow" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "migratedToNodeId" TEXT,
    CONSTRAINT "BP_PF_criteria_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "BP_PF_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_criteria_domainId_code_key" UNIQUE("domainId", "code")
);
CREATE INDEX IF NOT EXISTS "BP_PF_criteria_domainId_idx" ON "BP_PF_criteria"("domainId");
CREATE INDEX IF NOT EXISTS "BP_PF_criteria_code_idx" ON "BP_PF_criteria"("code");

-- ScoreOption table (legacy)
CREATE TABLE IF NOT EXISTS "BP_PF_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criterionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_options_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_options_criterionId_idx" ON "BP_PF_options"("criterionId");

-- ScoreRange table (legacy)
CREATE TABLE IF NOT EXISTS "BP_PF_ranges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criterionId" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_ranges_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_ranges_criterionId_idx" ON "BP_PF_ranges"("criterionId");

-- Scoring table
CREATE TABLE IF NOT EXISTS "BP_PF_scorings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "scoreGlobal" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "composantes" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "dateCalcul" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_scorings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_scorings_projectId_idx" ON "BP_PF_scorings"("projectId");

\echo 'Created: BP_PF_domains, BP_PF_criteria, BP_PF_options, BP_PF_ranges, BP_PF_scorings ✓'

-- ============================================================================
-- SECTION 3: EVALUATION & AUDIT TABLES
-- ============================================================================

\echo 'Creating evaluation and audit tables...'

-- AuditLog table
CREATE TABLE IF NOT EXISTS "BP_PF_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "utilisateurId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "dateAction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_audit_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_audit_logs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_audit_logs_projectId_idx" ON "BP_PF_audit_logs"("projectId");
CREATE INDEX IF NOT EXISTS "BP_PF_audit_logs_utilisateurId_idx" ON "BP_PF_audit_logs"("utilisateurId");
CREATE INDEX IF NOT EXISTS "BP_PF_audit_logs_dateAction_idx" ON "BP_PF_audit_logs"("dateAction");

-- EvaluationDomainScore table
CREATE TABLE IF NOT EXISTS "BP_PF_evaluation_domain_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "domainId" TEXT NOT NULL,
    "scoringId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_evaluation_domain_scores_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "BP_PF_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_evaluation_domain_scores_scoringId_fkey" FOREIGN KEY ("scoringId") REFERENCES "BP_PF_scorings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_evaluation_domain_scores_domainId_scoringId_key" UNIQUE("domainId", "scoringId")
);
CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_domain_scores_domainId_idx" ON "BP_PF_evaluation_domain_scores"("domainId");
CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_domain_scores_scoringId_idx" ON "BP_PF_evaluation_domain_scores"("scoringId");

-- EvaluationAnswer table
CREATE TABLE IF NOT EXISTS "BP_PF_evaluation_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criterionId" TEXT NOT NULL,
    "scoringId" TEXT NOT NULL,
    "answerType" TEXT NOT NULL DEFAULT 'OPTION',
    "optionValue" TEXT,
    "rangeValue" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_evaluation_answers_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_evaluation_answers_scoringId_fkey" FOREIGN KEY ("scoringId") REFERENCES "BP_PF_scorings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_answers_criterionId_idx" ON "BP_PF_evaluation_answers"("criterionId");
CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_answers_scoringId_idx" ON "BP_PF_evaluation_answers"("scoringId");

-- Evaluation table (new v7++)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "analystId" TEXT NOT NULL,
    "scoringResult" JSONB,
    "stressTestResult" JSONB,
    "rating" TEXT NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "recommendation" TEXT NOT NULL,
    "probabilityOfDefault" DOUBLE PRECISION NOT NULL,
    "triggeredNOGOs" JSONB NOT NULL,
    "appliedMALUS" JSONB NOT NULL,
    "malusTotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'brouillon',
    "version" TEXT NOT NULL DEFAULT '7.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_evaluations_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluations_projectId_idx" ON "BP_PF_v7pp_evaluations"("projectId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluations_analystId_idx" ON "BP_PF_v7pp_evaluations"("analystId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluations_status_idx" ON "BP_PF_v7pp_evaluations"("status");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluations_rating_idx" ON "BP_PF_v7pp_evaluations"("rating");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluations_createdAt_idx" ON "BP_PF_v7pp_evaluations"("createdAt");

-- StressTestScenarioResult table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_stress_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "dscrBase" DOUBLE PRECISION NOT NULL,
    "dscrStress" DOUBLE PRECISION NOT NULL,
    "llcrStress" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_v7pp_stress_results_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_stress_results_evaluationId_idx" ON "BP_PF_v7pp_stress_results"("evaluationId");

-- ScoringAuditLog table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "previousScore" DOUBLE PRECISION,
    "newScore" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_v7pp_audit_logs_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_audit_logs_evaluationId_idx" ON "BP_PF_v7pp_audit_logs"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_audit_logs_userId_idx" ON "BP_PF_v7pp_audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_audit_logs_timestamp_idx" ON "BP_PF_v7pp_audit_logs"("timestamp");

\echo 'Created: Evaluation and Audit tables ✓'

-- ============================================================================
-- SECTION 4: CONFIG & REFERENCE TABLES
-- ============================================================================

\echo 'Creating config and reference tables...'

-- Country table
CREATE TABLE IF NOT EXISTS "BP_PF_countries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "label" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "BP_PF_countries_code_idx" ON "BP_PF_countries"("code");

-- SystemConfig table
CREATE TABLE IF NOT EXISTS "BP_PF_system_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "BP_PF_system_config_key_idx" ON "BP_PF_system_config"("key");

\echo 'Created: BP_PF_countries, BP_PF_system_config ✓'

-- ============================================================================
-- SECTION 5: NEW SCORING GOVERNANCE TABLES
-- ============================================================================

\echo 'Creating new scoring governance tables...'

-- ScoringModel table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_models" (
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
    CONSTRAINT "BP_PF_v7pp_scoring_models_ownerBusinessId_fkey" FOREIGN KEY ("ownerBusinessId") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_models_code_idx" ON "BP_PF_v7pp_scoring_models"("code");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_models_status_idx" ON "BP_PF_v7pp_scoring_models"("status");

-- ScoringModelVersion table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_versions" (
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
    CONSTRAINT "BP_PF_v7pp_scoring_versions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BP_PF_v7pp_scoring_models"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_versions_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_versions_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_versions_modelId_versionNumber_key" UNIQUE("modelId", "versionNumber")
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_versions_modelId_idx" ON "BP_PF_v7pp_scoring_versions"("modelId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_versions_status_idx" ON "BP_PF_v7pp_scoring_versions"("status");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_versions_isPublished_idx" ON "BP_PF_v7pp_scoring_versions"("isPublished");

-- ScoringNode table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_nodes" (
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
    CONSTRAINT "BP_PF_v7pp_scoring_nodes_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_nodes_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_nodes_versionId_code_key" UNIQUE("versionId", "code")
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_nodes_versionId_idx" ON "BP_PF_v7pp_scoring_nodes"("versionId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_nodes_parentNodeId_idx" ON "BP_PF_v7pp_scoring_nodes"("parentNodeId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_nodes_nodeType_idx" ON "BP_PF_v7pp_scoring_nodes"("nodeType");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_nodes_isActive_idx" ON "BP_PF_v7pp_scoring_nodes"("isActive");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_nodes_depth_idx" ON "BP_PF_v7pp_scoring_nodes"("depth");

-- ScoringNodeOption table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_options" (
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
    CONSTRAINT "BP_PF_v7pp_scoring_options_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_options_nodeId_code_key" UNIQUE("nodeId", "code")
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_options_nodeId_idx" ON "BP_PF_v7pp_scoring_options"("nodeId");

-- ScoringNodeRange table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_ranges" (
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
    CONSTRAINT "BP_PF_v7pp_scoring_ranges_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_ranges_nodeId_idx" ON "BP_PF_v7pp_scoring_ranges"("nodeId");

-- ScoringNodeFormula table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_formulas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
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
    CONSTRAINT "BP_PF_v7pp_scoring_formulas_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_formulas_nodeId_key" UNIQUE("nodeId")
);

-- ScoringNodeRule table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_rules" (
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
    CONSTRAINT "BP_PF_v7pp_scoring_rules_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_rules_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_rules_nodeId_idx" ON "BP_PF_v7pp_scoring_rules"("nodeId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_rules_versionId_idx" ON "BP_PF_v7pp_scoring_rules"("versionId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_rules_ruleType_idx" ON "BP_PF_v7pp_scoring_rules"("ruleType");

-- ScoringNodeApplicabilityRule table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_applicability_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "conditionExpression" TEXT NOT NULL,
    "effectType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_v7pp_applicability_rules_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_applicability_rules_nodeId_idx" ON "BP_PF_v7pp_applicability_rules"("nodeId");

-- ScoringNodeDocumentRequirement table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_document_requirements" (
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
    CONSTRAINT "BP_PF_v7pp_document_requirements_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_document_requirements_nodeId_idx" ON "BP_PF_v7pp_document_requirements"("nodeId");

\echo 'Created: ScoringModel, ScoringModelVersion, ScoringNode and related tables ✓'

-- ============================================================================
-- SECTION 6: SCORING EVALUATION (NEW MODEL) TABLES
-- ============================================================================

\echo 'Creating scoring evaluation tables...'

-- ScoringEvaluation table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_evaluations" (
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
    CONSTRAINT "BP_PF_v7pp_scoring_evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_evaluations_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BP_PF_v7pp_scoring_models"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_evaluations_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "BP_PF_v7pp_scoring_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_evaluations_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_evaluations_projectId_idx" ON "BP_PF_v7pp_scoring_evaluations"("projectId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_evaluations_modelId_idx" ON "BP_PF_v7pp_scoring_evaluations"("modelId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_evaluations_modelVersionId_idx" ON "BP_PF_v7pp_scoring_evaluations"("modelVersionId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_evaluations_analystId_idx" ON "BP_PF_v7pp_scoring_evaluations"("analystId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_evaluations_status_idx" ON "BP_PF_v7pp_scoring_evaluations"("status");

-- ScoringEvaluationAnswer table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_evaluation_answers" (
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
    CONSTRAINT "BP_PF_v7pp_evaluation_answers_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_evaluation_answers_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_evaluation_answers_evaluationId_nodeId_key" UNIQUE("evaluationId", "nodeId")
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluation_answers_evaluationId_idx" ON "BP_PF_v7pp_evaluation_answers"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluation_answers_nodeId_idx" ON "BP_PF_v7pp_evaluation_answers"("nodeId");

-- ScoringEvaluationNodeResult table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_evaluation_node_results" (
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
    CONSTRAINT "BP_PF_v7pp_evaluation_node_results_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_evaluation_node_results_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_evaluation_node_results_evaluationId_nodeId_key" UNIQUE("evaluationId", "nodeId")
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluation_node_results_evaluationId_idx" ON "BP_PF_v7pp_evaluation_node_results"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluation_node_results_nodeId_idx" ON "BP_PF_v7pp_evaluation_node_results"("nodeId");

\echo 'Created: ScoringEvaluation and related tables ✓'

-- ============================================================================
-- SECTION 7: CHANGE LOG & AUDIT TABLES
-- ============================================================================

\echo 'Creating change log tables...'

-- ScoringChangeLog table
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_change_logs" (
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
    CONSTRAINT "BP_PF_v7pp_change_logs_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BP_PF_v7pp_scoring_models"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_change_logs_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_change_logs_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_change_logs_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_change_logs_entityType_idx" ON "BP_PF_v7pp_change_logs"("entityType");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_change_logs_entityId_idx" ON "BP_PF_v7pp_change_logs"("entityId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_change_logs_modelId_idx" ON "BP_PF_v7pp_change_logs"("modelId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_change_logs_versionId_idx" ON "BP_PF_v7pp_change_logs"("versionId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_change_logs_evaluationId_idx" ON "BP_PF_v7pp_change_logs"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_change_logs_changedBy_idx" ON "BP_PF_v7pp_change_logs"("changedBy");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_change_logs_changedAt_idx" ON "BP_PF_v7pp_change_logs"("changedAt");

\echo 'Created: ScoringChangeLog table ✓'

-- ============================================================================
-- SECTION 8: FORM CONFIGURATION TABLES
-- ============================================================================

\echo 'Creating form configuration tables...'

-- FormSection table
CREATE TABLE IF NOT EXISTS "BP_PF_form_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "columns" INTEGER NOT NULL DEFAULT 2,
    "orderIndex" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "layout" TEXT NOT NULL DEFAULT 'accordion',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_form_sections_entity_title_key" UNIQUE("entity", "title")
);
CREATE INDEX IF NOT EXISTS "BP_PF_form_sections_entity_idx" ON "BP_PF_form_sections"("entity");
CREATE INDEX IF NOT EXISTS "BP_PF_form_sections_orderIndex_idx" ON "BP_PF_form_sections"("orderIndex");

-- FieldConfiguration table
CREATE TABLE IF NOT EXISTS "BP_PF_field_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "sectionId" TEXT,
    "fieldName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "helpText" TEXT,
    "validation" TEXT,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "min" DOUBLE PRECISION,
    "max" DOUBLE PRECISION,
    "step" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "editable" BOOLEAN NOT NULL DEFAULT true,
    "customOptions" JSONB,
    "defaultValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "BP_PF_field_configurations_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BP_PF_form_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_field_configurations_entity_fieldName_key" UNIQUE("entity", "fieldName")
);
CREATE INDEX IF NOT EXISTS "BP_PF_field_configurations_entity_idx" ON "BP_PF_field_configurations"("entity");
CREATE INDEX IF NOT EXISTS "BP_PF_field_configurations_sectionId_idx" ON "BP_PF_field_configurations"("sectionId");
CREATE INDEX IF NOT EXISTS "BP_PF_field_configurations_visible_idx" ON "BP_PF_field_configurations"("visible");
CREATE INDEX IF NOT EXISTS "BP_PF_field_configurations_orderIndex_idx" ON "BP_PF_field_configurations"("orderIndex");

-- FormPreset table
CREATE TABLE IF NOT EXISTS "BP_PF_form_presets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fieldIds" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "BP_PF_form_presets_entity_name_key" UNIQUE("entity", "name")
);
CREATE INDEX IF NOT EXISTS "BP_PF_form_presets_entity_idx" ON "BP_PF_form_presets"("entity");
CREATE INDEX IF NOT EXISTS "BP_PF_form_presets_isDefault_idx" ON "BP_PF_form_presets"("isDefault");

\echo 'Created: FormSection, FieldConfiguration, FormPreset tables ✓'

-- ============================================================================
-- SECTION 9: SCORING GRID CONFIGURATION TABLES
-- ============================================================================

\echo 'Creating scoring grid configuration tables...'

-- ScoringCriterion table (new - not legacy)
CREATE TABLE IF NOT EXISTS "BP_PF_scoring_criteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "scoreType" TEXT NOT NULL DEFAULT 'NUMERIC',
    "formula" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT
);
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_criteria_category_idx" ON "BP_PF_scoring_criteria"("category");
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_criteria_isActive_idx" ON "BP_PF_scoring_criteria"("isActive");
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_criteria_orderIndex_idx" ON "BP_PF_scoring_criteria"("orderIndex");

-- ScoringThreshold table
CREATE TABLE IF NOT EXISTS "BP_PF_scoring_thresholds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criterionId" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_scoring_thresholds_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_scoring_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_thresholds_criterionId_idx" ON "BP_PF_scoring_thresholds"("criterionId");
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_thresholds_orderIndex_idx" ON "BP_PF_scoring_thresholds"("orderIndex");

-- ScoringOption table
CREATE TABLE IF NOT EXISTS "BP_PF_scoring_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criterionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_scoring_options_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_scoring_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_options_criterionId_idx" ON "BP_PF_scoring_options"("criterionId");
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_options_orderIndex_idx" ON "BP_PF_scoring_options"("orderIndex");

-- ScoringGrille table
CREATE TABLE IF NOT EXISTS "BP_PF_scoring_grilles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "businessSegment" TEXT,
    "projectType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "criteriaWeightTotal" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "publishedBy" TEXT
);
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_grilles_status_idx" ON "BP_PF_scoring_grilles"("status");
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_grilles_isActive_idx" ON "BP_PF_scoring_grilles"("isActive");
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_grilles_isDefault_idx" ON "BP_PF_scoring_grilles"("isDefault");

-- ScoringWeightingRule table
CREATE TABLE IF NOT EXISTS "BP_PF_scoring_weighting_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grilleCode" TEXT NOT NULL,
    "criterionCode" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "applicableToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_scoring_weighting_rules_grilleCode_criterionCode_key" UNIQUE("grilleCode", "criterionCode")
);
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_weighting_rules_grilleCode_idx" ON "BP_PF_scoring_weighting_rules"("grilleCode");

\echo 'Created: ScoringCriterion, ScoringThreshold, ScoringOption, ScoringGrille tables ✓'

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

\echo ''
\echo '================================================================================'
\echo '                        ALL TABLES CREATED SUCCESSFULLY'
\echo '================================================================================'
\echo ''

DO $$
DECLARE
    v_table_count INT;
    v_index_count INT;
    v_fk_count INT;
BEGIN
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'BP_PF%';

    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename LIKE 'BP_PF%';

    SELECT COUNT(*) INTO v_fk_count
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY';

    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Tables created: %', v_table_count;
    RAISE NOTICE '  - Indexes created: %', v_index_count;
    RAISE NOTICE '  - Foreign Keys: %', v_fk_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Database schema is now complete and ready to use!';
    RAISE NOTICE 'Run: npm run dev';
END $$;

\echo ''
\echo '================================================================================'
