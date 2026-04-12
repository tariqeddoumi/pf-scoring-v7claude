-- ============================================================================
-- DATABASE SYNCHRONIZATION SCRIPT
-- Synchronise la base de données avec le schéma Prisma
-- Created: 2026-04-12
-- Purpose: Ensure all tables and columns match the schema definition
-- ============================================================================

-- Enable PostgreSQL extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- SECTION 1: VERIFY AND CREATE CORE TABLES
-- ============================================================================

-- Check if BP_PF_users table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'BP_PF_users'
    ) THEN
        CREATE TABLE "BP_PF_users" (
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
        CREATE INDEX "BP_PF_users_email_idx" ON "BP_PF_users"("email");
        RAISE NOTICE 'Created table BP_PF_users';
    ELSE
        RAISE NOTICE 'Table BP_PF_users already exists';
    END IF;
END $$;

-- Check if BP_PF_clients table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'BP_PF_clients'
    ) THEN
        CREATE TABLE "BP_PF_clients" (
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
            "updatedAt" TIMESTAMP(3) NOT NULL
        );
        CREATE INDEX "BP_PF_clients_email_idx" ON "BP_PF_clients"("email");
        CREATE INDEX "BP_PF_clients_status_idx" ON "BP_PF_clients"("status");
        RAISE NOTICE 'Created table BP_PF_clients';
    ELSE
        RAISE NOTICE 'Table BP_PF_clients already exists';
    END IF;
END $$;

-- Check if BP_PF_projects table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'BP_PF_projects'
    ) THEN
        CREATE TABLE "BP_PF_projects" (
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
            CONSTRAINT "BP_PF_projects_creePar_fkey" FOREIGN KEY ("creePar") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE,
            CONSTRAINT "BP_PF_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BP_PF_clients"("id") ON DELETE SET NULL
        );
        CREATE INDEX "BP_PF_projects_creePar_idx" ON "BP_PF_projects"("creePar");
        CREATE INDEX "BP_PF_projects_clientId_idx" ON "BP_PF_projects"("clientId");
        CREATE INDEX "BP_PF_projects_status_idx" ON "BP_PF_projects"("status");
        CREATE INDEX "BP_PF_projects_secteur_idx" ON "BP_PF_projects"("secteur");
        RAISE NOTICE 'Created table BP_PF_projects';
    ELSE
        RAISE NOTICE 'Table BP_PF_projects already exists';
    END IF;
END $$;

-- Check if BP_PF_v7pp_evaluations table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'BP_PF_v7pp_evaluations'
    ) THEN
        CREATE TABLE "BP_PF_v7pp_evaluations" (
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
            CONSTRAINT "BP_PF_v7pp_evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE,
            CONSTRAINT "BP_PF_v7pp_evaluations_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL
        );
        CREATE INDEX "BP_PF_v7pp_evaluations_projectId_idx" ON "BP_PF_v7pp_evaluations"("projectId");
        CREATE INDEX "BP_PF_v7pp_evaluations_analystId_idx" ON "BP_PF_v7pp_evaluations"("analystId");
        CREATE INDEX "BP_PF_v7pp_evaluations_status_idx" ON "BP_PF_v7pp_evaluations"("status");
        CREATE INDEX "BP_PF_v7pp_evaluations_rating_idx" ON "BP_PF_v7pp_evaluations"("rating");
        CREATE INDEX "BP_PF_v7pp_evaluations_createdAt_idx" ON "BP_PF_v7pp_evaluations"("createdAt");
        RAISE NOTICE 'Created table BP_PF_v7pp_evaluations';
    ELSE
        RAISE NOTICE 'Table BP_PF_v7pp_evaluations already exists';
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: VERIFY AND ADD MISSING COLUMNS
-- ============================================================================

-- Add missing columns to BP_PF_users if they don't exist
DO $$
BEGIN
    -- Check and add email column with unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'BP_PF_users'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE "BP_PF_users" ADD COLUMN "email" TEXT NOT NULL UNIQUE;
        RAISE NOTICE 'Added column email to BP_PF_users';
    END IF;

    -- Check and add other missing columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'BP_PF_users'
        AND column_name = 'oauthProvider'
    ) THEN
        ALTER TABLE "BP_PF_users" ADD COLUMN "oauthProvider" TEXT;
        RAISE NOTICE 'Added column oauthProvider to BP_PF_users';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'BP_PF_users'
        AND column_name = 'oauthId'
    ) THEN
        ALTER TABLE "BP_PF_users" ADD COLUMN "oauthId" TEXT;
        RAISE NOTICE 'Added column oauthId to BP_PF_users';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'BP_PF_users'
        AND column_name = 'avatar'
    ) THEN
        ALTER TABLE "BP_PF_users" ADD COLUMN "avatar" TEXT;
        RAISE NOTICE 'Added column avatar to BP_PF_users';
    END IF;
END $$;

-- Add missing columns to BP_PF_clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'BP_PF_clients'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE "BP_PF_clients" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Actif';
        RAISE NOTICE 'Added column status to BP_PF_clients';
    END IF;
END $$;

-- Add missing columns to BP_PF_projects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'BP_PF_projects'
        AND column_name = 'countryCode'
    ) THEN
        ALTER TABLE "BP_PF_projects" ADD COLUMN "countryCode" TEXT;
        RAISE NOTICE 'Added column countryCode to BP_PF_projects';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'BP_PF_projects'
        AND column_name = 'scoreGlobal'
    ) THEN
        ALTER TABLE "BP_PF_projects" ADD COLUMN "scoreGlobal" DOUBLE PRECISION;
        RAISE NOTICE 'Added column scoreGlobal to BP_PF_projects';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'BP_PF_projects'
        AND column_name = 'grade'
    ) THEN
        ALTER TABLE "BP_PF_projects" ADD COLUMN "grade" TEXT;
        RAISE NOTICE 'Added column grade to BP_PF_projects';
    END IF;
END $$;

-- ============================================================================
-- SECTION 3: VERIFY CRITICAL CONSTRAINTS
-- ============================================================================

-- Verify foreign key constraints exist
DO $$
BEGIN
    -- Check BP_PF_projects constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'BP_PF_projects'
        AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%creePar%'
    ) THEN
        ALTER TABLE "BP_PF_projects"
        ADD CONSTRAINT "BP_PF_projects_creePar_fkey"
        FOREIGN KEY ("creePar") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for BP_PF_projects.creePar';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'BP_PF_projects'
        AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%clientId%'
    ) THEN
        ALTER TABLE "BP_PF_projects"
        ADD CONSTRAINT "BP_PF_projects_clientId_fkey"
        FOREIGN KEY ("clientId") REFERENCES "BP_PF_clients"("id") ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for BP_PF_projects.clientId';
    END IF;

    -- Check BP_PF_v7pp_evaluations constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'BP_PF_v7pp_evaluations'
        AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%projectId%'
    ) THEN
        ALTER TABLE "BP_PF_v7pp_evaluations"
        ADD CONSTRAINT "BP_PF_v7pp_evaluations_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for BP_PF_v7pp_evaluations.projectId';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND table_name = 'BP_PF_v7pp_evaluations'
        AND constraint_type = 'FOREIGN KEY' AND constraint_name LIKE '%analystId%'
    ) THEN
        ALTER TABLE "BP_PF_v7pp_evaluations"
        ADD CONSTRAINT "BP_PF_v7pp_evaluations_analystId_fkey"
        FOREIGN KEY ("analystId") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for BP_PF_v7pp_evaluations.analystId';
    END IF;
END $$;

-- ============================================================================
-- SECTION 4: VERIFY INDEXES
-- ============================================================================

-- Create indexes for better performance
DO $$
BEGIN
    -- BP_PF_users indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'BP_PF_users' AND indexname = 'BP_PF_users_email_idx'
    ) THEN
        CREATE INDEX "BP_PF_users_email_idx" ON "BP_PF_users"("email");
        RAISE NOTICE 'Created index BP_PF_users_email_idx';
    END IF;

    -- BP_PF_clients indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'BP_PF_clients' AND indexname = 'BP_PF_clients_email_idx'
    ) THEN
        CREATE INDEX "BP_PF_clients_email_idx" ON "BP_PF_clients"("email");
        RAISE NOTICE 'Created index BP_PF_clients_email_idx';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'BP_PF_clients' AND indexname = 'BP_PF_clients_status_idx'
    ) THEN
        CREATE INDEX "BP_PF_clients_status_idx" ON "BP_PF_clients"("status");
        RAISE NOTICE 'Created index BP_PF_clients_status_idx';
    END IF;

    -- BP_PF_projects indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'BP_PF_projects' AND indexname = 'BP_PF_projects_creePar_idx'
    ) THEN
        CREATE INDEX "BP_PF_projects_creePar_idx" ON "BP_PF_projects"("creePar");
        RAISE NOTICE 'Created index BP_PF_projects_creePar_idx';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'BP_PF_projects' AND indexname = 'BP_PF_projects_clientId_idx'
    ) THEN
        CREATE INDEX "BP_PF_projects_clientId_idx" ON "BP_PF_projects"("clientId");
        RAISE NOTICE 'Created index BP_PF_projects_clientId_idx';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'BP_PF_projects' AND indexname = 'BP_PF_projects_status_idx'
    ) THEN
        CREATE INDEX "BP_PF_projects_status_idx" ON "BP_PF_projects"("status");
        RAISE NOTICE 'Created index BP_PF_projects_status_idx';
    END IF;

    -- BP_PF_v7pp_evaluations indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'BP_PF_v7pp_evaluations' AND indexname = 'BP_PF_v7pp_evaluations_projectId_idx'
    ) THEN
        CREATE INDEX "BP_PF_v7pp_evaluations_projectId_idx" ON "BP_PF_v7pp_evaluations"("projectId");
        RAISE NOTICE 'Created index BP_PF_v7pp_evaluations_projectId_idx';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'BP_PF_v7pp_evaluations' AND indexname = 'BP_PF_v7pp_evaluations_status_idx'
    ) THEN
        CREATE INDEX "BP_PF_v7pp_evaluations_status_idx" ON "BP_PF_v7pp_evaluations"("status");
        RAISE NOTICE 'Created index BP_PF_v7pp_evaluations_status_idx';
    END IF;
END $$;

-- ============================================================================
-- SECTION 5: VERIFICATION REPORT
-- ============================================================================

-- Generate verification report
SELECT
    'VERIFICATION REPORT' as "RAPPORT DE VÉRIFICATION",
    NOW()::TEXT as "Date/Heure"
;

-- Table summary
SELECT
    tablename as "Table",
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.tablename AND table_schema = 'public') as "Colonnes",
    obj_description(('public.' || tablename)::regclass, 'pg_class') as "Description"
FROM pg_tables t
WHERE schemaname = 'public' AND tablename LIKE 'BP_PF%'
ORDER BY tablename;

-- Column verification for main tables
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('BP_PF_users', 'BP_PF_clients', 'BP_PF_projects', 'BP_PF_v7pp_evaluations')
ORDER BY table_name, ordinal_position;

-- Foreign key verification
SELECT
    constraint_name,
    table_name,
    column_name,
    referenced_table_name,
    referenced_column_name
FROM information_schema.referential_constraints
WHERE constraint_schema = 'public'
ORDER BY table_name;

-- Index verification
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'BP_PF%'
ORDER BY tablename, indexname;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'DATABASE SYNCHRONIZATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'All tables, columns, constraints and indexes have been verified and created.';
    RAISE NOTICE 'Run "prisma db push" or "prisma migrate deploy" to apply any remaining changes.';
    RAISE NOTICE '================================================================================';
END $$;
