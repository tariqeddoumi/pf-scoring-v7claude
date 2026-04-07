-- ============================================================================
-- PF SCORING V7++ - Complete Schema with BP_PF Prefix for Supabase
-- Execute this script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'analyst', 'viewer');
CREATE TYPE "ProjectStatus" AS ENUM ('brouillon', 'en_cours', 'en_revue', 'approuve', 'rejete');
CREATE TYPE "EvaluationStatus" AS ENUM ('brouillon', 'soumis', 'valide', 'rejete');

-- ============================================================================
-- 2. CREATE CORE TABLES
-- ============================================================================

-- Users Table
CREATE TABLE "BP_PF_users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255),
  "nom" VARCHAR(100) NOT NULL,
  "prenom" VARCHAR(100) NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'analyst',
  "oauthProvider" VARCHAR(255),
  "oauthId" VARCHAR(255),
  "avatar" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_users_email_idx" ON "BP_PF_users"("email");
CREATE INDEX "BP_PF_users_role_idx" ON "BP_PF_users"("role");

-- Projects Table
CREATE TABLE "BP_PF_projects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nom" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "secteur" VARCHAR(100),
  "montant" FLOAT NOT NULL,
  "devise" VARCHAR(3) DEFAULT 'MAD',
  "status" "ProjectStatus" DEFAULT 'brouillon',
  "scoreGlobal" FLOAT,
  "grade" VARCHAR(10),
  "creePar" UUID NOT NULL REFERENCES "BP_PF_users"("id") ON DELETE CASCADE,
  "countryCode" VARCHAR(2),
  "dateCreation" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_projects_creePar_idx" ON "BP_PF_projects"("creePar");
CREATE INDEX "BP_PF_projects_status_idx" ON "BP_PF_projects"("status");
CREATE INDEX "BP_PF_projects_secteur_idx" ON "BP_PF_projects"("secteur");
CREATE INDEX "BP_PF_projects_dateCreation_idx" ON "BP_PF_projects"("dateCreation" DESC);

-- ============================================================================
-- 3. CREATE SCORING CONFIGURATION TABLES
-- ============================================================================

CREATE TABLE "BP_PF_domains" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(50) UNIQUE NOT NULL,
  "label" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "weight" FLOAT DEFAULT 0.125,
  "orderIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_domains_code_idx" ON "BP_PF_domains"("code");

CREATE TABLE "BP_PF_criteria" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "domainId" UUID NOT NULL REFERENCES "BP_PF_domains"("id") ON DELETE CASCADE,
  "code" VARCHAR(255) NOT NULL,
  "label" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "type" VARCHAR(50) DEFAULT 'OPTION',
  "isActive" BOOLEAN DEFAULT true,
  "hardStopIfBelow" FLOAT,
  "orderIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("domainId", "code")
);

CREATE INDEX "BP_PF_criteria_domainId_idx" ON "BP_PF_criteria"("domainId");

CREATE TABLE "BP_PF_options" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "criterionId" UUID NOT NULL REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE,
  "label" VARCHAR(255) NOT NULL,
  "score" FLOAT NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_options_criterionId_idx" ON "BP_PF_options"("criterionId");

CREATE TABLE "BP_PF_ranges" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "criterionId" UUID NOT NULL REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE,
  "minValue" FLOAT NOT NULL,
  "maxValue" FLOAT NOT NULL,
  "score" FLOAT NOT NULL,
  "label" VARCHAR(255),
  "orderIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_ranges_criterionId_idx" ON "BP_PF_ranges"("criterionId");

CREATE TABLE "BP_PF_countries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(2) UNIQUE NOT NULL,
  "label" VARCHAR(255) NOT NULL,
  "riskScore" FLOAT DEFAULT 50.0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_countries_code_idx" ON "BP_PF_countries"("code");

CREATE TABLE "BP_PF_system_config" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR(255) UNIQUE NOT NULL,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_system_config_key_idx" ON "BP_PF_system_config"("key");

-- ============================================================================
-- 4. CREATE SCORING TABLES
-- ============================================================================

CREATE TABLE "BP_PF_scorings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE,
  "scoreGlobal" FLOAT NOT NULL,
  "grade" VARCHAR(10),
  "composantes" JSONB,
  "version" INTEGER NOT NULL,
  "dateCalcul" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_scorings_projectId_idx" ON "BP_PF_scorings"("projectId");

CREATE TABLE "BP_PF_evaluation_domain_scores" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "domainId" UUID NOT NULL REFERENCES "BP_PF_domains"("id") ON DELETE CASCADE,
  "scoringId" UUID NOT NULL REFERENCES "BP_PF_scorings"("id") ON DELETE CASCADE,
  "score" FLOAT NOT NULL,
  "weight" FLOAT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("domainId", "scoringId")
);

CREATE INDEX "BP_PF_evaluation_domain_scores_domainId_idx" ON "BP_PF_evaluation_domain_scores"("domainId");
CREATE INDEX "BP_PF_evaluation_domain_scores_scoringId_idx" ON "BP_PF_evaluation_domain_scores"("scoringId");

CREATE TABLE "BP_PF_evaluation_answers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "criterionId" UUID NOT NULL REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE,
  "scoringId" UUID NOT NULL REFERENCES "BP_PF_scorings"("id") ON DELETE CASCADE,
  "answerType" VARCHAR(50) DEFAULT 'OPTION',
  "optionValue" VARCHAR(255),
  "rangeValue" FLOAT,
  "score" FLOAT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_evaluation_answers_criterionId_idx" ON "BP_PF_evaluation_answers"("criterionId");
CREATE INDEX "BP_PF_evaluation_answers_scoringId_idx" ON "BP_PF_evaluation_answers"("scoringId");

-- ============================================================================
-- 5. CREATE EVALUATION V7++ TABLES
-- ============================================================================

CREATE TABLE "BP_PF_evaluations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE,
  "analystId" UUID REFERENCES "BP_PF_users"("id") ON DELETE SET NULL,
  "scoringResult" JSONB NOT NULL,
  "stressTestResult" JSONB,
  "rating" VARCHAR(10),
  "finalScore" FLOAT NOT NULL,
  "recommendation" VARCHAR(50),
  "probabilityOfDefault" FLOAT,
  "triggeredNOGOs" JSONB,
  "appliedMALUS" JSONB,
  "malusTotal" FLOAT DEFAULT 0,
  "notes" TEXT,
  "status" "EvaluationStatus" DEFAULT 'brouillon',
  "version" VARCHAR(10) DEFAULT '7.0',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_evaluations_projectId_idx" ON "BP_PF_evaluations"("projectId");
CREATE INDEX "BP_PF_evaluations_analystId_idx" ON "BP_PF_evaluations"("analystId");
CREATE INDEX "BP_PF_evaluations_status_idx" ON "BP_PF_evaluations"("status");
CREATE INDEX "BP_PF_evaluations_rating_idx" ON "BP_PF_evaluations"("rating");
CREATE INDEX "BP_PF_evaluations_createdAt_idx" ON "BP_PF_evaluations"("createdAt");

CREATE TABLE "BP_PF_stress_test_results" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "evaluationId" UUID NOT NULL REFERENCES "BP_PF_evaluations"("id") ON DELETE CASCADE,
  "scenarioId" VARCHAR(50) NOT NULL,
  "scenarioName" VARCHAR(255) NOT NULL,
  "dscrBase" FLOAT,
  "dscrStress" FLOAT,
  "llcrStress" FLOAT,
  "status" VARCHAR(50),
  "margin" FLOAT,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_stress_test_results_evaluationId_idx" ON "BP_PF_stress_test_results"("evaluationId");

-- ============================================================================
-- 6. CREATE AUDIT TABLES
-- ============================================================================

CREATE TABLE "BP_PF_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID REFERENCES "BP_PF_projects"("id") ON DELETE SET NULL,
  "utilisateurId" UUID NOT NULL REFERENCES "BP_PF_users"("id") ON DELETE CASCADE,
  "action" VARCHAR(255) NOT NULL,
  "details" TEXT,
  "dateAction" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_audit_logs_projectId_idx" ON "BP_PF_audit_logs"("projectId");
CREATE INDEX "BP_PF_audit_logs_utilisateurId_idx" ON "BP_PF_audit_logs"("utilisateurId");
CREATE INDEX "BP_PF_audit_logs_dateAction_idx" ON "BP_PF_audit_logs"("dateAction");

CREATE TABLE "BP_PF_scoring_audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "evaluationId" UUID NOT NULL REFERENCES "BP_PF_evaluations"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "BP_PF_users"("id") ON DELETE CASCADE,
  "action" VARCHAR(50) NOT NULL,
  "changes" JSONB,
  "previousScore" FLOAT,
  "newScore" FLOAT,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "BP_PF_scoring_audit_logs_evaluationId_idx" ON "BP_PF_scoring_audit_logs"("evaluationId");
CREATE INDEX "BP_PF_scoring_audit_logs_userId_idx" ON "BP_PF_scoring_audit_logs"("userId");
CREATE INDEX "BP_PF_scoring_audit_logs_timestamp_idx" ON "BP_PF_scoring_audit_logs"("timestamp");

-- ============================================================================
-- 7. SUCCESS MESSAGE
-- ============================================================================

SELECT 'SUCCESS: All BP_PF tables created!' as status,
       CURRENT_TIMESTAMP as created_at,
       '15 tables, 3 enums, 26 indexes' as summary;
