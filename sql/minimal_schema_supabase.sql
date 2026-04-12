-- ============================================================================
-- MINIMAL SCHEMA FOR PF SCORING CRUD OPERATIONS
-- Pure SQL - Supabase Compatible
-- Only essential tables for Users, Clients, Projects, Evaluations
-- ============================================================================

-- ============================================================================
-- CORE TABLES (Required for CRUD)
-- ============================================================================

-- Users Table
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "BP_PF_users_email_key" ON "BP_PF_users"("email");
CREATE INDEX IF NOT EXISTS "BP_PF_users_email_idx" ON "BP_PF_users"("email");

-- Clients Table
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "BP_PF_clients_email_key" ON "BP_PF_clients"("email");
CREATE INDEX IF NOT EXISTS "BP_PF_clients_email_idx" ON "BP_PF_clients"("email");
CREATE INDEX IF NOT EXISTS "BP_PF_clients_status_idx" ON "BP_PF_clients"("status");

-- Projects Table
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
    "dateCreation" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_projects_creePar_fkey" FOREIGN KEY ("creePar") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE,
    CONSTRAINT "BP_PF_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BP_PF_clients"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "BP_PF_projects_creePar_idx" ON "BP_PF_projects"("creePar");
CREATE INDEX IF NOT EXISTS "BP_PF_projects_clientId_idx" ON "BP_PF_projects"("clientId");
CREATE INDEX IF NOT EXISTS "BP_PF_projects_status_idx" ON "BP_PF_projects"("status");
CREATE INDEX IF NOT EXISTS "BP_PF_projects_secteur_idx" ON "BP_PF_projects"("secteur");

-- Evaluations Table
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_v7pp_evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE,
    CONSTRAINT "BP_PF_v7pp_evaluations_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluations_projectId_idx" ON "BP_PF_v7pp_evaluations"("projectId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluations_analystId_idx" ON "BP_PF_v7pp_evaluations"("analystId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluations_status_idx" ON "BP_PF_v7pp_evaluations"("status");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluations_rating_idx" ON "BP_PF_v7pp_evaluations"("rating");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluations_createdAt_idx" ON "BP_PF_v7pp_evaluations"("createdAt");

-- ============================================================================
-- LEGACY SCORING TABLES (Required by Prisma schema)
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "migratedToNodeId" TEXT,
    CONSTRAINT "BP_PF_criteria_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "BP_PF_domains"("id") ON DELETE CASCADE,
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_options_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE
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
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_ranges_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_ranges_criterionId_idx" ON "BP_PF_ranges"("criterionId");

-- Scoring table (legacy)
CREATE TABLE IF NOT EXISTS "BP_PF_scorings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criterionId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_scorings_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE,
    CONSTRAINT "BP_PF_scorings_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "BP_PF_domains"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "BP_PF_scorings_criterionId_idx" ON "BP_PF_scorings"("criterionId");
CREATE INDEX IF NOT EXISTS "BP_PF_scorings_domainId_idx" ON "BP_PF_scorings"("domainId");

-- ============================================================================
-- Summary: 4 core tables + 5 legacy tables = 9 tables
-- All required for CRUD operations and API functionality
-- ============================================================================
