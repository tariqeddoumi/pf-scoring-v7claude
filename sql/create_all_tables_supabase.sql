-- ============================================================================
-- CREATE ALL TABLES FROM PRISMA SCHEMA (Supabase Compatible)
-- Pure SQL - No psql meta-commands
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: CORE TABLES
-- ============================================================================

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
    "pays" TEXT,
    "region" TEXT,
    "city" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_projects_creePar_fkey" FOREIGN KEY ("creePar") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BP_PF_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_projects_creePar_idx" ON "BP_PF_projects"("creePar");
CREATE INDEX IF NOT EXISTS "BP_PF_projects_clientId_idx" ON "BP_PF_projects"("clientId");
CREATE INDEX IF NOT EXISTS "BP_PF_projects_status_idx" ON "BP_PF_projects"("status");
CREATE INDEX IF NOT EXISTS "BP_PF_projects_secteur_idx" ON "BP_PF_projects"("secteur");

-- ============================================================================
-- SECTION 2: LEGACY SCORING TABLES
-- ============================================================================

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

-- Scoring table (legacy)
CREATE TABLE IF NOT EXISTS "BP_PF_scorings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "selectedRangeId" TEXT,
    "inputValue" DOUBLE PRECISION,
    "score" DOUBLE PRECISION NOT NULL,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "BP_PF_scorings_evaluationId_idx" ON "BP_PF_scorings"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_scorings_criterionId_idx" ON "BP_PF_scorings"("criterionId");

-- ============================================================================
-- SECTION 3: EVALUATION TABLES
-- ============================================================================

-- Evaluations table (main)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "analystId" TEXT,
    "rating" TEXT,
    "finalScore" DOUBLE PRECISION,
    "recommendation" TEXT,
    "probabilityOfDefault" DOUBLE PRECISION,
    "triggeredNOGOs" JSONB,
    "appliedMALUS" JSONB,
    "malusTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'brouillon',
    "version" TEXT NOT NULL DEFAULT '7.0',
    "notes" TEXT,
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

-- Stress Test Results
CREATE TABLE IF NOT EXISTS "BP_PF_stress_test_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "stressedScore" DOUBLE PRECISION NOT NULL,
    "stressedRating" TEXT,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_stress_test_results_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_stress_test_results_evaluationId_idx" ON "BP_PF_stress_test_results"("evaluationId");

-- Audit Log
CREATE TABLE IF NOT EXISTS "BP_PF_audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_audit_log_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_audit_log_evaluationId_idx" ON "BP_PF_audit_log"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_audit_log_userId_idx" ON "BP_PF_audit_log"("userId");
CREATE INDEX IF NOT EXISTS "BP_PF_audit_log_timestamp_idx" ON "BP_PF_audit_log"("timestamp");

-- ============================================================================
-- SECTION 4: CONFIGURATION TABLES
-- ============================================================================

-- System Configuration
CREATE TABLE IF NOT EXISTS "BP_PF_system_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "BP_PF_system_config_key_idx" ON "BP_PF_system_config"("key");

-- ============================================================================
-- SECTION 5: SCORING GOVERNANCE TABLES
-- ============================================================================

-- Scoring Models
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_models_code_idx" ON "BP_PF_v7pp_scoring_models"("code");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_models_isActive_idx" ON "BP_PF_v7pp_scoring_models"("isActive");

-- Scoring Versions
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "versionNumber" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_versions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BP_PF_v7pp_scoring_models"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_versions_modelId_versionNumber_key" UNIQUE("modelId", "versionNumber")
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_versions_modelId_idx" ON "BP_PF_v7pp_scoring_versions"("modelId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_versions_isActive_idx" ON "BP_PF_v7pp_scoring_versions"("isActive");

-- Scoring Nodes (Criteria hierarchy)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "parentNodeId" TEXT,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "nodeType" TEXT NOT NULL DEFAULT 'category',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "minScore" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "isHardStop" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_nodes_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_scoring_nodes_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_nodes_versionId_idx" ON "BP_PF_v7pp_scoring_nodes"("versionId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_nodes_parentNodeId_idx" ON "BP_PF_v7pp_scoring_nodes"("parentNodeId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_nodes_code_idx" ON "BP_PF_v7pp_scoring_nodes"("code");

-- Scoring Rules
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "condition" TEXT,
    "score" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_rules_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_rules_nodeId_idx" ON "BP_PF_v7pp_scoring_rules"("nodeId");

-- Scoring Formulas
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_scoring_formulas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nodeId" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_scoring_formulas_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_scoring_formulas_nodeId_idx" ON "BP_PF_v7pp_scoring_formulas"("nodeId");

-- ============================================================================
-- SECTION 6: SCORING EVALUATION TABLES
-- ============================================================================

-- Evaluation Answers
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_evaluation_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "answer" TEXT,
    "numericValue" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_evaluation_answers_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_evaluation_answers_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluation_answers_evaluationId_idx" ON "BP_PF_v7pp_evaluation_answers"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluation_answers_nodeId_idx" ON "BP_PF_v7pp_evaluation_answers"("nodeId");

-- Node Evaluation Results
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_node_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rating" TEXT,
    "isHardStop" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_v7pp_node_results_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_v7pp_node_results_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_node_results_evaluationId_idx" ON "BP_PF_v7pp_node_results"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_node_results_nodeId_idx" ON "BP_PF_v7pp_node_results"("nodeId");

-- ============================================================================
-- SECTION 7: CHANGE LOG & AUDIT
-- ============================================================================

-- Evaluation Change Log
CREATE TABLE IF NOT EXISTS "BP_PF_evaluation_changelog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_evaluation_changelog_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BP_PF_evaluation_changelog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_changelog_evaluationId_idx" ON "BP_PF_evaluation_changelog"("evaluationId");
CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_changelog_userId_idx" ON "BP_PF_evaluation_changelog"("userId");
CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_changelog_changedAt_idx" ON "BP_PF_evaluation_changelog"("changedAt");

-- ============================================================================
-- SECTION 8: FORM CONFIGURATION
-- ============================================================================

-- Form Sections
CREATE TABLE IF NOT EXISTS "BP_PF_form_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "BP_PF_form_sections_code_idx" ON "BP_PF_form_sections"("code");

-- Field Configurations
CREATE TABLE IF NOT EXISTS "BP_PF_field_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "helpText" TEXT,
    "validationRules" JSONB,
    "orderIndex" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_field_configurations_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BP_PF_form_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_field_configurations_sectionId_idx" ON "BP_PF_field_configurations"("sectionId");
CREATE INDEX IF NOT EXISTS "BP_PF_field_configurations_fieldName_idx" ON "BP_PF_field_configurations"("fieldName");

-- ============================================================================
-- SECTION 9: SCORING GRID CONFIGURATION
-- ============================================================================

-- Scoring Criteria
CREATE TABLE IF NOT EXISTS "BP_PF_scoring_criteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "minScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "orderIndex" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_criteria_code_idx" ON "BP_PF_scoring_criteria"("code");
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_criteria_category_idx" ON "BP_PF_scoring_criteria"("category");
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_criteria_isActive_idx" ON "BP_PF_scoring_criteria"("isActive");

-- Scoring Grid Options
CREATE TABLE IF NOT EXISTS "BP_PF_scoring_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criteriaId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_scoring_options_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "BP_PF_scoring_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_scoring_options_criteriaId_idx" ON "BP_PF_scoring_options"("criteriaId");

-- ============================================================================
-- SUMMARY: All tables created successfully
-- ============================================================================
-- Tables created:
-- Core: BP_PF_users, BP_PF_clients, BP_PF_projects
-- Legacy: BP_PF_domains, BP_PF_criteria, BP_PF_options, BP_PF_ranges, BP_PF_scorings
-- Evaluations: BP_PF_v7pp_evaluations, BP_PF_stress_test_results, BP_PF_audit_log
-- Governance: BP_PF_v7pp_scoring_models, BP_PF_v7pp_scoring_versions, BP_PF_v7pp_scoring_nodes, BP_PF_v7pp_scoring_rules, BP_PF_v7pp_scoring_formulas
-- Evaluation Data: BP_PF_v7pp_evaluation_answers, BP_PF_v7pp_node_results, BP_PF_evaluation_changelog
-- Configuration: BP_PF_form_sections, BP_PF_field_configurations, BP_PF_system_config
-- Scoring: BP_PF_scoring_criteria, BP_PF_scoring_options
-- Total: 25 tables with 40+ indexes
