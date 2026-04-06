import { NextResponse } from "next/server";
import prisma from "@/lib/prisma-client";

/**
 * Endpoint pour créer le schéma complet BP_PF dans la base de données
 * Utilise le SQL brut pour créer toutes les tables avec indexes
 * Sécurisé avec un token Bearer
 */

export async function POST(request: Request) {
  try {
    // Vérifier le token de sécurité
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.INIT_TOKEN || "init-secret-token";

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Non autorisé - Token invalide" },
        { status: 401 }
      );
    }

    const results: { [key: string]: string } = {};

    // ========================================================================
    // 1. CREATE ENUMS
    // ========================================================================

    // UserRole enum
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
            CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'analyst', 'viewer');
          END IF;
        END $$;
      `);
      results.enum_userrole = "✓ Enum UserRole créé/vérifié";
    } catch (error) {
      results.enum_userrole_error = (error as Error).message;
    }

    // ProjectStatus enum
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProjectStatus') THEN
            CREATE TYPE "ProjectStatus" AS ENUM ('brouillon', 'en_cours', 'en_revue', 'approuve', 'rejete');
          END IF;
        END $$;
      `);
      results.enum_projectstatus = "✓ Enum ProjectStatus créé/vérifié";
    } catch (error) {
      results.enum_projectstatus_error = (error as Error).message;
    }

    // EvaluationStatus enum
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EvaluationStatus') THEN
            CREATE TYPE "EvaluationStatus" AS ENUM ('brouillon', 'soumis', 'valide', 'rejete');
          END IF;
        END $$;
      `);
      results.enum_evaluationstatus = "✓ Enum EvaluationStatus créé/vérifié";
    } catch (error) {
      results.enum_evaluationstatus_error = (error as Error).message;
    }

    // ========================================================================
    // 2. CREATE CORE TABLES
    // ========================================================================

    // BP_PF_users
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_users" (
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
        CREATE INDEX IF NOT EXISTS "BP_PF_users_email_idx" ON "BP_PF_users"("email");
        CREATE INDEX IF NOT EXISTS "BP_PF_users_role_idx" ON "BP_PF_users"("role");
      `);
      results.table_users = "✓ Table BP_PF_users créée/vérifiée";
    } catch (error) {
      results.table_users_error = (error as Error).message;
    }

    // BP_PF_projects
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_projects" (
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
        CREATE INDEX IF NOT EXISTS "BP_PF_projects_creePar_idx" ON "BP_PF_projects"("creePar");
        CREATE INDEX IF NOT EXISTS "BP_PF_projects_status_idx" ON "BP_PF_projects"("status");
        CREATE INDEX IF NOT EXISTS "BP_PF_projects_secteur_idx" ON "BP_PF_projects"("secteur");
        CREATE INDEX IF NOT EXISTS "BP_PF_projects_dateCreation_idx" ON "BP_PF_projects"("dateCreation" DESC);
      `);
      results.table_projects = "✓ Table BP_PF_projects créée/vérifiée";
    } catch (error) {
      results.table_projects_error = (error as Error).message;
    }

    // ========================================================================
    // 3. CREATE SCORING CONFIGURATION TABLES
    // ========================================================================

    // BP_PF_domains
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_domains" (
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
        CREATE INDEX IF NOT EXISTS "BP_PF_domains_code_idx" ON "BP_PF_domains"("code");
      `);
      results.table_domains = "✓ Table BP_PF_domains créée/vérifiée";
    } catch (error) {
      results.table_domains_error = (error as Error).message;
    }

    // BP_PF_criteria
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_criteria" (
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
        CREATE INDEX IF NOT EXISTS "BP_PF_criteria_domainId_idx" ON "BP_PF_criteria"("domainId");
      `);
      results.table_criteria = "✓ Table BP_PF_criteria créée/vérifiée";
    } catch (error) {
      results.table_criteria_error = (error as Error).message;
    }

    // BP_PF_options
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_options" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "criterionId" UUID NOT NULL REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE,
          "label" VARCHAR(255) NOT NULL,
          "score" FLOAT NOT NULL,
          "orderIndex" INTEGER NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "BP_PF_options_criterionId_idx" ON "BP_PF_options"("criterionId");
      `);
      results.table_options = "✓ Table BP_PF_options créée/vérifiée";
    } catch (error) {
      results.table_options_error = (error as Error).message;
    }

    // BP_PF_ranges
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_ranges" (
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
        CREATE INDEX IF NOT EXISTS "BP_PF_ranges_criterionId_idx" ON "BP_PF_ranges"("criterionId");
      `);
      results.table_ranges = "✓ Table BP_PF_ranges créée/vérifiée";
    } catch (error) {
      results.table_ranges_error = (error as Error).message;
    }

    // BP_PF_countries
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_countries" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "code" VARCHAR(2) UNIQUE NOT NULL,
          "label" VARCHAR(255) NOT NULL,
          "riskScore" FLOAT DEFAULT 50.0,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "BP_PF_countries_code_idx" ON "BP_PF_countries"("code");
      `);
      results.table_countries = "✓ Table BP_PF_countries créée/vérifiée";
    } catch (error) {
      results.table_countries_error = (error as Error).message;
    }

    // BP_PF_system_config
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_system_config" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "key" VARCHAR(255) UNIQUE NOT NULL,
          "value" TEXT NOT NULL,
          "description" TEXT,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "BP_PF_system_config_key_idx" ON "BP_PF_system_config"("key");
      `);
      results.table_system_config = "✓ Table BP_PF_system_config créée/vérifiée";
    } catch (error) {
      results.table_system_config_error = (error as Error).message;
    }

    // ========================================================================
    // 4. CREATE SCORING TABLES
    // ========================================================================

    // BP_PF_scorings
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_scorings" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "projectId" UUID NOT NULL REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE,
          "scoreGlobal" FLOAT NOT NULL,
          "grade" VARCHAR(10),
          "composantes" JSONB,
          "version" INTEGER NOT NULL,
          "dateCalcul" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "BP_PF_scorings_projectId_idx" ON "BP_PF_scorings"("projectId");
      `);
      results.table_scorings = "✓ Table BP_PF_scorings créée/vérifiée";
    } catch (error) {
      results.table_scorings_error = (error as Error).message;
    }

    // BP_PF_evaluation_domain_scores
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_evaluation_domain_scores" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "domainId" UUID NOT NULL REFERENCES "BP_PF_domains"("id") ON DELETE CASCADE,
          "scoringId" UUID NOT NULL REFERENCES "BP_PF_scorings"("id") ON DELETE CASCADE,
          "score" FLOAT NOT NULL,
          "weight" FLOAT NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("domainId", "scoringId")
        );
        CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_domain_scores_domainId_idx" ON "BP_PF_evaluation_domain_scores"("domainId");
        CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_domain_scores_scoringId_idx" ON "BP_PF_evaluation_domain_scores"("scoringId");
      `);
      results.table_eval_domain_scores = "✓ Table BP_PF_evaluation_domain_scores créée/vérifiée";
    } catch (error) {
      results.table_eval_domain_scores_error = (error as Error).message;
    }

    // BP_PF_evaluation_answers
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_evaluation_answers" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "criterionId" UUID NOT NULL REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE,
          "scoringId" UUID NOT NULL REFERENCES "BP_PF_scorings"("id") ON DELETE CASCADE,
          "answerType" VARCHAR(50) DEFAULT 'OPTION',
          "optionValue" VARCHAR(255),
          "rangeValue" FLOAT,
          "score" FLOAT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_answers_criterionId_idx" ON "BP_PF_evaluation_answers"("criterionId");
        CREATE INDEX IF NOT EXISTS "BP_PF_evaluation_answers_scoringId_idx" ON "BP_PF_evaluation_answers"("scoringId");
      `);
      results.table_eval_answers = "✓ Table BP_PF_evaluation_answers créée/vérifiée";
    } catch (error) {
      results.table_eval_answers_error = (error as Error).message;
    }

    // ========================================================================
    // 5. CREATE EVALUATION V7++ TABLES
    // ========================================================================

    // BP_PF_evaluations
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_evaluations" (
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
        CREATE INDEX IF NOT EXISTS "BP_PF_evaluations_projectId_idx" ON "BP_PF_evaluations"("projectId");
        CREATE INDEX IF NOT EXISTS "BP_PF_evaluations_analystId_idx" ON "BP_PF_evaluations"("analystId");
        CREATE INDEX IF NOT EXISTS "BP_PF_evaluations_status_idx" ON "BP_PF_evaluations"("status");
        CREATE INDEX IF NOT EXISTS "BP_PF_evaluations_rating_idx" ON "BP_PF_evaluations"("rating");
        CREATE INDEX IF NOT EXISTS "BP_PF_evaluations_createdAt_idx" ON "BP_PF_evaluations"("createdAt");
      `);
      results.table_evaluations = "✓ Table BP_PF_evaluations créée/vérifiée";
    } catch (error) {
      results.table_evaluations_error = (error as Error).message;
    }

    // BP_PF_stress_test_results
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_stress_test_results" (
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
        CREATE INDEX IF NOT EXISTS "BP_PF_stress_test_results_evaluationId_idx" ON "BP_PF_stress_test_results"("evaluationId");
      `);
      results.table_stress_results = "✓ Table BP_PF_stress_test_results créée/vérifiée";
    } catch (error) {
      results.table_stress_results_error = (error as Error).message;
    }

    // ========================================================================
    // 6. CREATE AUDIT TABLES
    // ========================================================================

    // BP_PF_audit_logs
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_audit_logs" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "projectId" UUID REFERENCES "BP_PF_projects"("id") ON DELETE SET NULL,
          "utilisateurId" UUID NOT NULL REFERENCES "BP_PF_users"("id") ON DELETE CASCADE,
          "action" VARCHAR(255) NOT NULL,
          "details" TEXT,
          "dateAction" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "BP_PF_audit_logs_projectId_idx" ON "BP_PF_audit_logs"("projectId");
        CREATE INDEX IF NOT EXISTS "BP_PF_audit_logs_utilisateurId_idx" ON "BP_PF_audit_logs"("utilisateurId");
        CREATE INDEX IF NOT EXISTS "BP_PF_audit_logs_dateAction_idx" ON "BP_PF_audit_logs"("dateAction");
      `);
      results.table_audit_logs = "✓ Table BP_PF_audit_logs créée/vérifiée";
    } catch (error) {
      results.table_audit_logs_error = (error as Error).message;
    }

    // BP_PF_scoring_audit_logs
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BP_PF_scoring_audit_logs" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "evaluationId" UUID NOT NULL REFERENCES "BP_PF_evaluations"("id") ON DELETE CASCADE,
          "userId" UUID NOT NULL REFERENCES "BP_PF_users"("id") ON DELETE CASCADE,
          "action" VARCHAR(50) NOT NULL,
          "changes" JSONB,
          "previousScore" FLOAT,
          "newScore" FLOAT,
          "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS "BP_PF_scoring_audit_logs_evaluationId_idx" ON "BP_PF_scoring_audit_logs"("evaluationId");
        CREATE INDEX IF NOT EXISTS "BP_PF_scoring_audit_logs_userId_idx" ON "BP_PF_scoring_audit_logs"("userId");
        CREATE INDEX IF NOT EXISTS "BP_PF_scoring_audit_logs_timestamp_idx" ON "BP_PF_scoring_audit_logs"("timestamp");
      `);
      results.table_scoring_audit_logs = "✓ Table BP_PF_scoring_audit_logs créée/vérifiée";
    } catch (error) {
      results.table_scoring_audit_logs_error = (error as Error).message;
    }

    // ========================================================================
    // 7. VERIFY CONNECTION
    // ========================================================================

    try {
      const userCount = await prisma.user.count().catch(() => 0);
      const projectCount = await prisma.project.count().catch(() => 0);
      results.database_connection = `✓ Connexion OK - ${userCount} utilisateur(s), ${projectCount} projet(s)`;
    } catch (error) {
      results.database_connection_error = (error as Error).message;
    }

    return NextResponse.json(
      {
        success: true,
        message: "✓ Schéma BP_PF créé avec succès",
        results,
        tables_created: Object.keys(results).filter(
          (k) => k.startsWith("table_") && !k.endsWith("_error")
        ).length,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur lors de la migration:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la migration du schéma",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Endpoint de migration BP_PF - Utilisez POST avec Bearer token",
    instructions: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-init-token",
      },
      example_curl: `curl -X POST http://localhost:3000/api/db-migrate -H "Authorization: Bearer init-secret-token"`,
    },
    tables: [
      "BP_PF_users",
      "BP_PF_projects",
      "BP_PF_evaluations",
      "BP_PF_scorings",
      "BP_PF_domains",
      "BP_PF_criteria",
      "BP_PF_options",
      "BP_PF_ranges",
      "BP_PF_countries",
      "BP_PF_system_config",
      "BP_PF_evaluation_domain_scores",
      "BP_PF_evaluation_answers",
      "BP_PF_stress_test_results",
      "BP_PF_audit_logs",
      "BP_PF_scoring_audit_logs",
    ],
  });
}
