-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('brouillon', 'en_cours', 'en_revue', 'approuve', 'rejete');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('system_admin', 'scoring_admin', 'risk_manager', 'committee_member', 'risk_analyst', 'auditor', 'read_only');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('brouillon', 'soumis', 'valide', 'rejete');

-- CreateEnum
CREATE TYPE "ScoringModelStatus" AS ENUM ('DRAFT', 'IN_VALIDATION', 'PUBLISHED', 'RETIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScoringNodeType" AS ENUM ('DOMAIN', 'GROUP', 'CRITERION', 'SUB_CRITERION', 'SUB_SUB_CRITERION', 'LEAF', 'BLOCK');

-- CreateEnum
CREATE TYPE "ScoringAnswerType" AS ENUM ('OPTION_SINGLE', 'OPTION_MULTI', 'BOOLEAN', 'NUMERIC', 'NUMERIC_RANGE', 'PERCENTAGE', 'CURRENCY', 'DATE', 'TEXT', 'LONG_TEXT', 'SCORE_DIRECT', 'FORMULA_INPUT', 'LOOKUP_VALUE', 'DOCUMENT_CHECK', 'REFERENCE_LIST');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('HARD_STOP', 'NO_GO', 'MALUS', 'WARNING', 'REQUIRE_REVIEW', 'VISIBILITY', 'MANDATORY_IF', 'BLOCK_PUBLICATION');

-- CreateTable
CREATE TABLE "BP_PF_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'read_only',
    "oauthProvider" TEXT,
    "oauthId" TEXT,
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_user_audit_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "performedById" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_user_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_clients" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "secteur" TEXT,
    "pays" TEXT,
    "type" TEXT DEFAULT 'Entreprise',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Actif',
    "raisonSociale" TEXT,
    "nomCommercial" TEXT,
    "typeClient" TEXT DEFAULT 'Entreprise',
    "formeJuridique" TEXT,
    "segmentClientele" TEXT,
    "ratingInterne" TEXT,
    "statutBancaire" TEXT DEFAULT 'Prospect',
    "statusKYC" TEXT DEFAULT 'En attente',
    "statusConformite" TEXT DEFAULT 'En attente',
    "effectifs" INTEGER,
    "capitalSocial" DOUBLE PRECISION,
    "chiffreAffaires" DOUBLE PRECISION,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "website" TEXT,
    "centreAffaires" TEXT,
    "gestionnaire" TEXT,
    "dateRelation" TIMESTAMP(3),
    "exposition" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_projects" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'MAD',
    "status" "ProjectStatus" NOT NULL DEFAULT 'brouillon',
    "scoreGlobal" DOUBLE PRECISION,
    "grade" TEXT,
    "creePar" UUID NOT NULL,
    "countryCode" TEXT,
    "pays" TEXT,
    "clientId" UUID,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateMiseAJour" TIMESTAMP(3) NOT NULL,
    "sponsorPrincipal" TEXT,
    "nomSPV" TEXT,
    "constructeurEPC" TEXT,
    "operateurOM" TEXT,
    "technologie" TEXT,
    "capaciteInstallee" DOUBLE PRECISION,
    "debutConstruction" TIMESTAMP(3),
    "finConstruction" TIMESTAMP(3),
    "coutTotal" DOUBLE PRECISION,
    "financement" DOUBLE PRECISION,
    "apportPropre" DOUBLE PRECISION,
    "structureCapitalePrincipale" TEXT,
    "dureeCredit" INTEGER,
    "taux" DOUBLE PRECISION,
    "typeCredit" TEXT,
    "dureeProjet" INTEGER,
    "periodeAmorce" INTEGER,
    "periodeRemboursement" INTEGER,
    "tauxCouverture" DOUBLE PRECISION,
    "ratio" DOUBLE PRECISION,

    CONSTRAINT "BP_PF_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_scorings" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "scoreGlobal" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "composantes" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "dateCalcul" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_scorings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_audit_logs" (
    "id" UUID NOT NULL,
    "projectId" UUID,
    "utilisateurId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "dateAction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_domains" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0.125,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "migratedToNodeId" TEXT,

    CONSTRAINT "BP_PF_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_criteria" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
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

    CONSTRAINT "BP_PF_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_options" (
    "id" UUID NOT NULL,
    "criterionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_ranges" (
    "id" UUID NOT NULL,
    "criterionId" UUID NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_countries" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_system_config" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_evaluation_domain_scores" (
    "id" UUID NOT NULL,
    "domainId" UUID NOT NULL,
    "scoringId" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_evaluation_domain_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_evaluation_answers" (
    "id" UUID NOT NULL,
    "criterionId" UUID NOT NULL,
    "scoringId" UUID NOT NULL,
    "answerType" TEXT NOT NULL DEFAULT 'OPTION',
    "optionValue" TEXT,
    "rangeValue" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_evaluation_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_evaluations" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "analystId" UUID,
    "scoringResult" JSONB NOT NULL,
    "stressTestResult" JSONB,
    "rating" TEXT NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "recommendation" TEXT NOT NULL,
    "probabilityOfDefault" DOUBLE PRECISION NOT NULL,
    "triggeredNOGOs" JSONB NOT NULL,
    "appliedMALUS" JSONB NOT NULL,
    "malusTotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'brouillon',
    "version" TEXT NOT NULL DEFAULT '7.0',
    "scoreFinancier" DOUBLE PRECISION,
    "scoreTechnique" DOUBLE PRECISION,
    "scoreMarche" DOUBLE PRECISION,
    "scoreEnvironnemental" DOUBLE PRECISION,
    "scoreSocial" DOUBLE PRECISION,
    "scoreGouvenance" DOUBLE PRECISION,
    "scoreJuridique" DOUBLE PRECISION,
    "scorePays" DOUBLE PRECISION,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "parentEvaluationId" UUID,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_stress_results" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "dscrBase" DOUBLE PRECISION NOT NULL,
    "dscrStress" DOUBLE PRECISION NOT NULL,
    "llcrStress" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_stress_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_audit_logs" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "previousScore" DOUBLE PRECISION,
    "newScore" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_models" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "businessSegment" TEXT,
    "projectType" TEXT,
    "status" "ScoringModelStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ownerBusinessId" UUID,
    "ownerRiskId" UUID,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_scoring_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_versions" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "changeReason" TEXT,
    "releaseNotes" TEXT,
    "createdBy" UUID NOT NULL,
    "validatedBy" UUID,
    "publishedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aggregationMethod" TEXT DEFAULT 'WEIGHTED_AVERAGE',
    "weightMode" TEXT DEFAULT 'RELATIVE',
    "scoreScale" TEXT DEFAULT '0_100',

    CONSTRAINT "BP_PF_v7pp_scoring_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_nodes" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "parentNodeId" TEXT,
    "nodeType" "ScoringNodeType" NOT NULL,
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
    "answerType" "ScoringAnswerType",
    "scoringMethod" TEXT,
    "scoreMin" DOUBLE PRECISION,
    "scoreMax" DOUBLE PRECISION,
    "defaultValue" TEXT,
    "unit" TEXT,
    "currency" TEXT,
    "uiSchemaJson" TEXT,
    "metadataJson" TEXT,
    "scoreLeafDepth" INTEGER,
    "isScoringLeaf" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_scoring_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_options" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "BP_PF_v7pp_scoring_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_ranges" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "BP_PF_v7pp_scoring_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_formulas" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "BP_PF_v7pp_scoring_formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_rules" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT,
    "versionId" TEXT NOT NULL,
    "ruleType" "RuleType" NOT NULL,
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

    CONSTRAINT "BP_PF_v7pp_scoring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_applicability_rules" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "conditionExpression" TEXT NOT NULL,
    "effectType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_applicability_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_node_data_bindings" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "sourceEntity" TEXT NOT NULL,
    "sourceField" TEXT,
    "sourcePath" TEXT,
    "bindingMode" TEXT NOT NULL DEFAULT 'AUTO_EDITABLE',
    "dataType" TEXT,
    "transformType" TEXT NOT NULL DEFAULT 'NONE',
    "transformConfigJson" TEXT,
    "defaultValue" TEXT,
    "fallbackValue" TEXT,
    "fallbackMessage" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "allowOverride" BOOLEAN NOT NULL DEFAULT true,
    "overrideRequiresReason" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_node_data_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_document_requirements" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "BP_PF_v7pp_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_evaluations" (
    "id" TEXT NOT NULL,
    "projectId" UUID NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelVersionId" TEXT NOT NULL,
    "analystId" UUID,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'brouillon',
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
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_scoring_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_evaluation_answers" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "answerType" "ScoringAnswerType" NOT NULL,
    "valueString" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueBoolean" BOOLEAN,
    "valueDate" TIMESTAMP(3),
    "valueJson" TEXT,
    "manualScore" DOUBLE PRECISION,
    "comment" TEXT,
    "sourceDocumentId" TEXT,
    "sourceType" TEXT,
    "sourceEntity" TEXT,
    "sourceField" TEXT,
    "sourcePath" TEXT,
    "sourceBindingId" TEXT,
    "sourceValueSnapshotJson" TEXT,
    "resolvedValueSnapshotJson" TEXT,
    "isAutoFilled" BOOLEAN NOT NULL DEFAULT false,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "overriddenBy" TEXT,
    "overriddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_evaluation_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_evaluation_node_results" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "BP_PF_v7pp_evaluation_node_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_change_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "modelId" TEXT,
    "versionId" TEXT,
    "evaluationId" TEXT,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValueJson" TEXT,
    "newValueJson" TEXT,
    "changedBy" UUID,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "BP_PF_v7pp_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_form_sections" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "BP_PF_form_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_field_configurations" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "BP_PF_field_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_form_presets" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fieldIds" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BP_PF_form_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_scoring_criteria" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
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
    "updatedBy" TEXT,

    CONSTRAINT "BP_PF_scoring_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_scoring_thresholds" (
    "id" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_scoring_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_scoring_options" (
    "id" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_scoring_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_scoring_grilles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
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
    "publishedBy" TEXT,

    CONSTRAINT "BP_PF_scoring_grilles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_scoring_weighting_rules" (
    "id" TEXT NOT NULL,
    "grilleCode" TEXT NOT NULL,
    "criterionCode" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "applicableToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_scoring_weighting_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_sectors" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_subsectors" (
    "id" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_subsectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_client_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_client_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_legal_forms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_legal_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_client_segments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_client_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_bank_statuses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_bank_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_internal_ratings" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "score" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_internal_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_kyc_statuses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_kyc_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_compliance_statuses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_compliance_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_workflows" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "requestedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "submittedBy" UUID,
    "reviewStartedAt" TIMESTAMP(3),
    "reviewCompletedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" UUID,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" UUID,
    "requiresCommitteeApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresRiskManagerReview" BOOLEAN NOT NULL DEFAULT true,
    "escalationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_scoring_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_workflow_steps" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "assignedTo" UUID,
    "assignedBy" UUID,
    "notes" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_scoring_workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_decisions" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "riskRating" TEXT NOT NULL,
    "recommendation" TEXT,
    "justification" TEXT NOT NULL,
    "hasConditions" BOOLEAN NOT NULL DEFAULT false,
    "conditionsJson" TEXT,
    "decidedBy" UUID NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiresHigherApproval" BOOLEAN NOT NULL DEFAULT false,
    "escalatedTo" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_scoring_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_overrides" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "originalValue" TEXT,
    "originalScore" DOUBLE PRECISION,
    "overriddenValue" TEXT,
    "overriddenScore" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "justification" TEXT,
    "riskLevel" TEXT NOT NULL,
    "overriddenBy" UUID NOT NULL,
    "overriddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "auditNotes" TEXT,
    "changeLog" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_scoring_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_documents" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "nodeId" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" UUID NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_scoring_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_comments" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "commentType" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentCommentId" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_scoring_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_scoring_approvals" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedFrom" TEXT NOT NULL,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "comments" TEXT,
    "signature" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "reminderSentAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v7pp_scoring_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_rating_buckets" (
    "id" TEXT NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "decisionPolicy" TEXT,
    "color" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scoring_rating_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v9_scoring_models" (
    "id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "description" TEXT,
    "socleVersion" TEXT NOT NULL DEFAULT 'V7++',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v9_scoring_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v9_sectors" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BP_PF_v9_sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v9_sector_thresholds" (
    "id" UUID NOT NULL,
    "sectorId" UUID NOT NULL,
    "ratioType" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v9_sector_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v9_sector_domain_weights" (
    "id" UUID NOT NULL,
    "sectorId" UUID NOT NULL,
    "domainCode" TEXT NOT NULL,
    "weightAdjusted" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v9_sector_domain_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v9_red_flags" (
    "id" UUID NOT NULL,
    "sectorId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isNoGo" BOOLEAN NOT NULL DEFAULT false,
    "penalty" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v9_red_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v9_indicators" (
    "id" UUID NOT NULL,
    "sectorId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT,
    "targetValue" TEXT,
    "direction" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v9_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v9_stress_tests" (
    "id" UUID NOT NULL,
    "sectorId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "variable" TEXT,
    "shockPct" DOUBLE PRECISION,
    "passDscrMin" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v9_stress_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v9_malus_bonus" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "domainCode" TEXT,
    "kind" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "magnitude" TEXT NOT NULL,
    "capPerDomain" DOUBLE PRECISION,
    "capGlobal" DOUBLE PRECISION,
    "nonCumulGroup" TEXT,
    "rationale" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v9_malus_bonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v9_anti_double_count" (
    "id" UUID NOT NULL,
    "factorCode" TEXT NOT NULL,
    "factorLabel" TEXT NOT NULL,
    "domainCode" TEXT NOT NULL,
    "arbitration" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v9_anti_double_count_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_app_configuration" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "BP_PF_app_configuration_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "BP_PF_app_config_history" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "changedBy" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_app_config_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_answer_types" (
    "id" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100),
    "description" TEXT,
    "requiresOptions" BOOLEAN DEFAULT false,
    "requiresRanges" BOOLEAN DEFAULT false,
    "supportsMultiple" BOOLEAN DEFAULT false,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "uiComponent" VARCHAR(100),
    "isActive" BOOLEAN DEFAULT true,
    "displayOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_answer_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_aggregation_methods" (
    "id" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100),
    "description" TEXT,
    "formula" TEXT,
    "requiresWeights" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "displayOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_aggregation_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_weight_modes" (
    "id" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100),
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "displayOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_weight_modes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_score_scales" (
    "id" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100),
    "description" TEXT,
    "minScore" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "isActive" BOOLEAN DEFAULT true,
    "displayOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_score_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BP_PF_v7pp_rating_scales" (
    "id" VARCHAR(50) NOT NULL,
    "label" VARCHAR(10),
    "description" TEXT,
    "minScore" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "color" VARCHAR(20),
    "displayOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BP_PF_v7pp_rating_scales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_users_email_key" ON "BP_PF_users"("email");

-- CreateIndex
CREATE INDEX "BP_PF_users_email_idx" ON "BP_PF_users"("email");

-- CreateIndex
CREATE INDEX "BP_PF_users_isActive_idx" ON "BP_PF_users"("isActive");

-- CreateIndex
CREATE INDEX "BP_PF_users_role_idx" ON "BP_PF_users"("role");

-- CreateIndex
CREATE INDEX "BP_PF_users_createdAt_idx" ON "BP_PF_users"("createdAt");

-- CreateIndex
CREATE INDEX "BP_PF_users_deletedAt_idx" ON "BP_PF_users"("deletedAt");

-- CreateIndex
CREATE INDEX "BP_PF_user_audit_logs_userId_idx" ON "BP_PF_user_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "BP_PF_user_audit_logs_performedById_idx" ON "BP_PF_user_audit_logs"("performedById");

-- CreateIndex
CREATE INDEX "BP_PF_user_audit_logs_action_idx" ON "BP_PF_user_audit_logs"("action");

-- CreateIndex
CREATE INDEX "BP_PF_user_audit_logs_createdAt_idx" ON "BP_PF_user_audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_clients_email_key" ON "BP_PF_clients"("email");

-- CreateIndex
CREATE INDEX "BP_PF_projects_creePar_idx" ON "BP_PF_projects"("creePar");

-- CreateIndex
CREATE INDEX "BP_PF_projects_clientId_idx" ON "BP_PF_projects"("clientId");

-- CreateIndex
CREATE INDEX "BP_PF_audit_logs_projectId_idx" ON "BP_PF_audit_logs"("projectId");

-- CreateIndex
CREATE INDEX "BP_PF_audit_logs_utilisateurId_idx" ON "BP_PF_audit_logs"("utilisateurId");

-- CreateIndex
CREATE INDEX "BP_PF_audit_logs_dateAction_idx" ON "BP_PF_audit_logs"("dateAction");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_domains_code_key" ON "BP_PF_domains"("code");

-- CreateIndex
CREATE INDEX "BP_PF_criteria_domainId_idx" ON "BP_PF_criteria"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_criteria_domainId_code_key" ON "BP_PF_criteria"("domainId", "code");

-- CreateIndex
CREATE INDEX "BP_PF_options_criterionId_idx" ON "BP_PF_options"("criterionId");

-- CreateIndex
CREATE INDEX "BP_PF_ranges_criterionId_idx" ON "BP_PF_ranges"("criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_countries_code_key" ON "BP_PF_countries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_system_config_key_key" ON "BP_PF_system_config"("key");

-- CreateIndex
CREATE INDEX "BP_PF_evaluation_domain_scores_domainId_idx" ON "BP_PF_evaluation_domain_scores"("domainId");

-- CreateIndex
CREATE INDEX "BP_PF_evaluation_domain_scores_scoringId_idx" ON "BP_PF_evaluation_domain_scores"("scoringId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_evaluation_domain_scores_domainId_scoringId_key" ON "BP_PF_evaluation_domain_scores"("domainId", "scoringId");

-- CreateIndex
CREATE INDEX "BP_PF_evaluation_answers_criterionId_idx" ON "BP_PF_evaluation_answers"("criterionId");

-- CreateIndex
CREATE INDEX "BP_PF_evaluation_answers_scoringId_idx" ON "BP_PF_evaluation_answers"("scoringId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluations_projectId_idx" ON "BP_PF_v7pp_evaluations"("projectId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluations_analystId_idx" ON "BP_PF_v7pp_evaluations"("analystId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluations_rating_idx" ON "BP_PF_v7pp_evaluations"("rating");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluations_createdAt_idx" ON "BP_PF_v7pp_evaluations"("createdAt");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluations_isArchived_idx" ON "BP_PF_v7pp_evaluations"("isArchived");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluations_parentEvaluationId_idx" ON "BP_PF_v7pp_evaluations"("parentEvaluationId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_stress_results_evaluationId_idx" ON "BP_PF_v7pp_stress_results"("evaluationId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_audit_logs_evaluationId_idx" ON "BP_PF_v7pp_audit_logs"("evaluationId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_audit_logs_userId_idx" ON "BP_PF_v7pp_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_audit_logs_timestamp_idx" ON "BP_PF_v7pp_audit_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v7pp_scoring_models_code_key" ON "BP_PF_v7pp_scoring_models"("code");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_versions_modelId_idx" ON "BP_PF_v7pp_scoring_versions"("modelId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_versions_status_idx" ON "BP_PF_v7pp_scoring_versions"("status");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_versions_isPublished_idx" ON "BP_PF_v7pp_scoring_versions"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v7pp_scoring_versions_modelId_versionNumber_key" ON "BP_PF_v7pp_scoring_versions"("modelId", "versionNumber");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_nodes_versionId_idx" ON "BP_PF_v7pp_scoring_nodes"("versionId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_nodes_parentNodeId_idx" ON "BP_PF_v7pp_scoring_nodes"("parentNodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_nodes_nodeType_idx" ON "BP_PF_v7pp_scoring_nodes"("nodeType");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_nodes_isActive_idx" ON "BP_PF_v7pp_scoring_nodes"("isActive");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_nodes_depth_idx" ON "BP_PF_v7pp_scoring_nodes"("depth");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v7pp_scoring_nodes_versionId_code_key" ON "BP_PF_v7pp_scoring_nodes"("versionId", "code");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_options_nodeId_idx" ON "BP_PF_v7pp_scoring_options"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v7pp_scoring_options_nodeId_code_key" ON "BP_PF_v7pp_scoring_options"("nodeId", "code");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_ranges_nodeId_idx" ON "BP_PF_v7pp_scoring_ranges"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v7pp_scoring_formulas_nodeId_key" ON "BP_PF_v7pp_scoring_formulas"("nodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_rules_nodeId_idx" ON "BP_PF_v7pp_scoring_rules"("nodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_rules_versionId_idx" ON "BP_PF_v7pp_scoring_rules"("versionId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_rules_ruleType_idx" ON "BP_PF_v7pp_scoring_rules"("ruleType");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_applicability_rules_nodeId_idx" ON "BP_PF_v7pp_applicability_rules"("nodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_node_data_bindings_nodeId_idx" ON "BP_PF_v7pp_node_data_bindings"("nodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_node_data_bindings_sourceEntity_idx" ON "BP_PF_v7pp_node_data_bindings"("sourceEntity");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_node_data_bindings_bindingMode_idx" ON "BP_PF_v7pp_node_data_bindings"("bindingMode");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_node_data_bindings_isActive_idx" ON "BP_PF_v7pp_node_data_bindings"("isActive");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_node_data_bindings_priority_idx" ON "BP_PF_v7pp_node_data_bindings"("priority");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_document_requirements_nodeId_idx" ON "BP_PF_v7pp_document_requirements"("nodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_projectId_idx" ON "BP_PF_v7pp_scoring_evaluations"("projectId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_modelId_idx" ON "BP_PF_v7pp_scoring_evaluations"("modelId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_modelVersionId_idx" ON "BP_PF_v7pp_scoring_evaluations"("modelVersionId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_analystId_idx" ON "BP_PF_v7pp_scoring_evaluations"("analystId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_status_idx" ON "BP_PF_v7pp_scoring_evaluations"("status");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_evaluations_isArchived_idx" ON "BP_PF_v7pp_scoring_evaluations"("isArchived");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluation_answers_evaluationId_idx" ON "BP_PF_v7pp_evaluation_answers"("evaluationId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluation_answers_nodeId_idx" ON "BP_PF_v7pp_evaluation_answers"("nodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluation_answers_sourceBindingId_idx" ON "BP_PF_v7pp_evaluation_answers"("sourceBindingId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluation_answers_sourceType_idx" ON "BP_PF_v7pp_evaluation_answers"("sourceType");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluation_answers_isAutoFilled_idx" ON "BP_PF_v7pp_evaluation_answers"("isAutoFilled");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluation_answers_isOverridden_idx" ON "BP_PF_v7pp_evaluation_answers"("isOverridden");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v7pp_evaluation_answers_evaluationId_nodeId_key" ON "BP_PF_v7pp_evaluation_answers"("evaluationId", "nodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluation_node_results_evaluationId_idx" ON "BP_PF_v7pp_evaluation_node_results"("evaluationId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_evaluation_node_results_nodeId_idx" ON "BP_PF_v7pp_evaluation_node_results"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v7pp_evaluation_node_results_evaluationId_nodeId_key" ON "BP_PF_v7pp_evaluation_node_results"("evaluationId", "nodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_change_logs_entityType_idx" ON "BP_PF_v7pp_change_logs"("entityType");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_change_logs_entityId_idx" ON "BP_PF_v7pp_change_logs"("entityId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_change_logs_modelId_idx" ON "BP_PF_v7pp_change_logs"("modelId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_change_logs_versionId_idx" ON "BP_PF_v7pp_change_logs"("versionId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_change_logs_evaluationId_idx" ON "BP_PF_v7pp_change_logs"("evaluationId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_change_logs_changedBy_idx" ON "BP_PF_v7pp_change_logs"("changedBy");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_change_logs_changedAt_idx" ON "BP_PF_v7pp_change_logs"("changedAt");

-- CreateIndex
CREATE INDEX "BP_PF_form_sections_entity_idx" ON "BP_PF_form_sections"("entity");

-- CreateIndex
CREATE INDEX "BP_PF_form_sections_orderIndex_idx" ON "BP_PF_form_sections"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_form_sections_entity_title_key" ON "BP_PF_form_sections"("entity", "title");

-- CreateIndex
CREATE INDEX "BP_PF_field_configurations_entity_idx" ON "BP_PF_field_configurations"("entity");

-- CreateIndex
CREATE INDEX "BP_PF_field_configurations_sectionId_idx" ON "BP_PF_field_configurations"("sectionId");

-- CreateIndex
CREATE INDEX "BP_PF_field_configurations_visible_idx" ON "BP_PF_field_configurations"("visible");

-- CreateIndex
CREATE INDEX "BP_PF_field_configurations_orderIndex_idx" ON "BP_PF_field_configurations"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_field_configurations_entity_fieldName_key" ON "BP_PF_field_configurations"("entity", "fieldName");

-- CreateIndex
CREATE INDEX "BP_PF_form_presets_entity_idx" ON "BP_PF_form_presets"("entity");

-- CreateIndex
CREATE INDEX "BP_PF_form_presets_isDefault_idx" ON "BP_PF_form_presets"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_form_presets_entity_name_key" ON "BP_PF_form_presets"("entity", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_scoring_criteria_code_key" ON "BP_PF_scoring_criteria"("code");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_criteria_category_idx" ON "BP_PF_scoring_criteria"("category");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_criteria_isActive_idx" ON "BP_PF_scoring_criteria"("isActive");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_criteria_orderIndex_idx" ON "BP_PF_scoring_criteria"("orderIndex");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_thresholds_criterionId_idx" ON "BP_PF_scoring_thresholds"("criterionId");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_thresholds_orderIndex_idx" ON "BP_PF_scoring_thresholds"("orderIndex");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_options_criterionId_idx" ON "BP_PF_scoring_options"("criterionId");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_options_orderIndex_idx" ON "BP_PF_scoring_options"("orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_scoring_grilles_code_key" ON "BP_PF_scoring_grilles"("code");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_grilles_status_idx" ON "BP_PF_scoring_grilles"("status");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_grilles_isActive_idx" ON "BP_PF_scoring_grilles"("isActive");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_grilles_isDefault_idx" ON "BP_PF_scoring_grilles"("isDefault");

-- CreateIndex
CREATE INDEX "BP_PF_scoring_weighting_rules_grilleCode_idx" ON "BP_PF_scoring_weighting_rules"("grilleCode");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_scoring_weighting_rules_grilleCode_criterionCode_key" ON "BP_PF_scoring_weighting_rules"("grilleCode", "criterionCode");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_sectors_code_key" ON "BP_PF_sectors"("code");

-- CreateIndex
CREATE INDEX "BP_PF_sectors_code_idx" ON "BP_PF_sectors"("code");

-- CreateIndex
CREATE INDEX "BP_PF_sectors_isActive_idx" ON "BP_PF_sectors"("isActive");

-- CreateIndex
CREATE INDEX "BP_PF_subsectors_sectorId_idx" ON "BP_PF_subsectors"("sectorId");

-- CreateIndex
CREATE INDEX "BP_PF_subsectors_code_idx" ON "BP_PF_subsectors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_subsectors_sectorId_code_key" ON "BP_PF_subsectors"("sectorId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_client_types_code_key" ON "BP_PF_client_types"("code");

-- CreateIndex
CREATE INDEX "BP_PF_client_types_code_idx" ON "BP_PF_client_types"("code");

-- CreateIndex
CREATE INDEX "BP_PF_client_types_isActive_idx" ON "BP_PF_client_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_legal_forms_code_key" ON "BP_PF_legal_forms"("code");

-- CreateIndex
CREATE INDEX "BP_PF_legal_forms_code_idx" ON "BP_PF_legal_forms"("code");

-- CreateIndex
CREATE INDEX "BP_PF_legal_forms_isActive_idx" ON "BP_PF_legal_forms"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_client_segments_code_key" ON "BP_PF_client_segments"("code");

-- CreateIndex
CREATE INDEX "BP_PF_client_segments_code_idx" ON "BP_PF_client_segments"("code");

-- CreateIndex
CREATE INDEX "BP_PF_client_segments_isActive_idx" ON "BP_PF_client_segments"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_bank_statuses_code_key" ON "BP_PF_bank_statuses"("code");

-- CreateIndex
CREATE INDEX "BP_PF_bank_statuses_code_idx" ON "BP_PF_bank_statuses"("code");

-- CreateIndex
CREATE INDEX "BP_PF_bank_statuses_isActive_idx" ON "BP_PF_bank_statuses"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_internal_ratings_code_key" ON "BP_PF_internal_ratings"("code");

-- CreateIndex
CREATE INDEX "BP_PF_internal_ratings_code_idx" ON "BP_PF_internal_ratings"("code");

-- CreateIndex
CREATE INDEX "BP_PF_internal_ratings_isActive_idx" ON "BP_PF_internal_ratings"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_kyc_statuses_code_key" ON "BP_PF_kyc_statuses"("code");

-- CreateIndex
CREATE INDEX "BP_PF_kyc_statuses_code_idx" ON "BP_PF_kyc_statuses"("code");

-- CreateIndex
CREATE INDEX "BP_PF_kyc_statuses_isActive_idx" ON "BP_PF_kyc_statuses"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_compliance_statuses_code_key" ON "BP_PF_compliance_statuses"("code");

-- CreateIndex
CREATE INDEX "BP_PF_compliance_statuses_code_idx" ON "BP_PF_compliance_statuses"("code");

-- CreateIndex
CREATE INDEX "BP_PF_compliance_statuses_isActive_idx" ON "BP_PF_compliance_statuses"("isActive");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_workflows_status_idx" ON "BP_PF_v7pp_scoring_workflows"("status");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_workflows_currentStep_idx" ON "BP_PF_v7pp_scoring_workflows"("currentStep");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_workflows_evaluationId_key" ON "BP_PF_v7pp_scoring_workflows"("evaluationId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_workflow_steps_workflowId_idx" ON "BP_PF_v7pp_scoring_workflow_steps"("workflowId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_workflow_steps_stepNumber_idx" ON "BP_PF_v7pp_scoring_workflow_steps"("stepNumber");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_workflow_steps_status_idx" ON "BP_PF_v7pp_scoring_workflow_steps"("status");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_decisions_workflowId_idx" ON "BP_PF_v7pp_scoring_decisions"("workflowId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_decisions_decisionType_idx" ON "BP_PF_v7pp_scoring_decisions"("decisionType");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_decisions_decidedAt_idx" ON "BP_PF_v7pp_scoring_decisions"("decidedAt");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_overrides_evaluationId_idx" ON "BP_PF_v7pp_scoring_overrides"("evaluationId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_overrides_nodeId_idx" ON "BP_PF_v7pp_scoring_overrides"("nodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_overrides_status_idx" ON "BP_PF_v7pp_scoring_overrides"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v7pp_scoring_overrides_evaluationId_nodeId_key" ON "BP_PF_v7pp_scoring_overrides"("evaluationId", "nodeId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_documents_evaluationId_idx" ON "BP_PF_v7pp_scoring_documents"("evaluationId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_documents_documentType_idx" ON "BP_PF_v7pp_scoring_documents"("documentType");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_documents_uploadedAt_idx" ON "BP_PF_v7pp_scoring_documents"("uploadedAt");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_comments_workflowId_idx" ON "BP_PF_v7pp_scoring_comments"("workflowId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_comments_createdAt_idx" ON "BP_PF_v7pp_scoring_comments"("createdAt");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_comments_isResolved_idx" ON "BP_PF_v7pp_scoring_comments"("isResolved");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_approvals_workflowId_idx" ON "BP_PF_v7pp_scoring_approvals"("workflowId");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_approvals_status_idx" ON "BP_PF_v7pp_scoring_approvals"("status");

-- CreateIndex
CREATE INDEX "BP_PF_v7pp_scoring_approvals_dueDate_idx" ON "BP_PF_v7pp_scoring_approvals"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v9_scoring_models_version_key" ON "BP_PF_v9_scoring_models"("version");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v9_sectors_code_key" ON "BP_PF_v9_sectors"("code");

-- CreateIndex
CREATE INDEX "BP_PF_v9_sector_thresholds_sectorId_idx" ON "BP_PF_v9_sector_thresholds"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v9_sector_thresholds_sectorId_ratioType_level_key" ON "BP_PF_v9_sector_thresholds"("sectorId", "ratioType", "level");

-- CreateIndex
CREATE INDEX "BP_PF_v9_sector_domain_weights_sectorId_idx" ON "BP_PF_v9_sector_domain_weights"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v9_sector_domain_weights_sectorId_domainCode_key" ON "BP_PF_v9_sector_domain_weights"("sectorId", "domainCode");

-- CreateIndex
CREATE INDEX "BP_PF_v9_red_flags_sectorId_idx" ON "BP_PF_v9_red_flags"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v9_red_flags_sectorId_code_key" ON "BP_PF_v9_red_flags"("sectorId", "code");

-- CreateIndex
CREATE INDEX "BP_PF_v9_indicators_sectorId_idx" ON "BP_PF_v9_indicators"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v9_indicators_sectorId_code_key" ON "BP_PF_v9_indicators"("sectorId", "code");

-- CreateIndex
CREATE INDEX "BP_PF_v9_stress_tests_sectorId_idx" ON "BP_PF_v9_stress_tests"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v9_stress_tests_sectorId_code_key" ON "BP_PF_v9_stress_tests"("sectorId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v9_malus_bonus_code_key" ON "BP_PF_v9_malus_bonus"("code");

-- CreateIndex
CREATE INDEX "BP_PF_v9_anti_double_count_factorCode_idx" ON "BP_PF_v9_anti_double_count"("factorCode");

-- CreateIndex
CREATE UNIQUE INDEX "BP_PF_v9_anti_double_count_factorCode_domainCode_key" ON "BP_PF_v9_anti_double_count"("factorCode", "domainCode");

-- CreateIndex
CREATE INDEX "BP_PF_app_config_history_key_idx" ON "BP_PF_app_config_history"("key");

-- CreateIndex
CREATE INDEX "idx_answer_types_active" ON "BP_PF_v7pp_answer_types"("isActive");

-- CreateIndex
CREATE INDEX "idx_aggregation_methods_active" ON "BP_PF_v7pp_aggregation_methods"("isActive");

-- CreateIndex
CREATE INDEX "idx_weight_modes_active" ON "BP_PF_v7pp_weight_modes"("isActive");

-- CreateIndex
CREATE INDEX "idx_score_scales_active" ON "BP_PF_v7pp_score_scales"("isActive");

-- CreateIndex
CREATE INDEX "idx_rating_scales_order" ON "BP_PF_v7pp_rating_scales"("displayOrder");

-- AddForeignKey
ALTER TABLE "BP_PF_user_audit_logs" ADD CONSTRAINT "BP_PF_user_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_user_audit_logs" ADD CONSTRAINT "BP_PF_user_audit_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_projects" ADD CONSTRAINT "BP_PF_projects_creePar_fkey" FOREIGN KEY ("creePar") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_projects" ADD CONSTRAINT "BP_PF_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BP_PF_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_scorings" ADD CONSTRAINT "BP_PF_scorings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_audit_logs" ADD CONSTRAINT "BP_PF_audit_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_audit_logs" ADD CONSTRAINT "BP_PF_audit_logs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_criteria" ADD CONSTRAINT "BP_PF_criteria_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "BP_PF_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_options" ADD CONSTRAINT "BP_PF_options_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_ranges" ADD CONSTRAINT "BP_PF_ranges_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_evaluation_domain_scores" ADD CONSTRAINT "BP_PF_evaluation_domain_scores_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "BP_PF_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_evaluation_domain_scores" ADD CONSTRAINT "BP_PF_evaluation_domain_scores_scoringId_fkey" FOREIGN KEY ("scoringId") REFERENCES "BP_PF_scorings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_evaluation_answers" ADD CONSTRAINT "BP_PF_evaluation_answers_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_evaluation_answers" ADD CONSTRAINT "BP_PF_evaluation_answers_scoringId_fkey" FOREIGN KEY ("scoringId") REFERENCES "BP_PF_scorings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_evaluations" ADD CONSTRAINT "BP_PF_v7pp_evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_evaluations" ADD CONSTRAINT "BP_PF_v7pp_evaluations_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_evaluations" ADD CONSTRAINT "BP_PF_v7pp_evaluations_parentEvaluationId_fkey" FOREIGN KEY ("parentEvaluationId") REFERENCES "BP_PF_v7pp_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_stress_results" ADD CONSTRAINT "BP_PF_v7pp_stress_results_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_audit_logs" ADD CONSTRAINT "BP_PF_v7pp_audit_logs_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_audit_logs" ADD CONSTRAINT "BP_PF_v7pp_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_models" ADD CONSTRAINT "BP_PF_v7pp_scoring_models_ownerBusinessId_fkey" FOREIGN KEY ("ownerBusinessId") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_versions" ADD CONSTRAINT "BP_PF_v7pp_scoring_versions_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BP_PF_v7pp_scoring_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_versions" ADD CONSTRAINT "BP_PF_v7pp_scoring_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_versions" ADD CONSTRAINT "BP_PF_v7pp_scoring_versions_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_versions" ADD CONSTRAINT "BP_PF_v7pp_scoring_versions_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_nodes" ADD CONSTRAINT "BP_PF_v7pp_scoring_nodes_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_nodes" ADD CONSTRAINT "BP_PF_v7pp_scoring_nodes_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_options" ADD CONSTRAINT "BP_PF_v7pp_scoring_options_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_ranges" ADD CONSTRAINT "BP_PF_v7pp_scoring_ranges_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_formulas" ADD CONSTRAINT "BP_PF_v7pp_scoring_formulas_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_rules" ADD CONSTRAINT "BP_PF_v7pp_scoring_rules_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_rules" ADD CONSTRAINT "BP_PF_v7pp_scoring_rules_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_applicability_rules" ADD CONSTRAINT "BP_PF_v7pp_applicability_rules_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_node_data_bindings" ADD CONSTRAINT "BP_PF_v7pp_node_data_bindings_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_document_requirements" ADD CONSTRAINT "BP_PF_v7pp_document_requirements_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_evaluations" ADD CONSTRAINT "BP_PF_v7pp_scoring_evaluations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BP_PF_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_evaluations" ADD CONSTRAINT "BP_PF_v7pp_scoring_evaluations_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BP_PF_v7pp_scoring_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_evaluations" ADD CONSTRAINT "BP_PF_v7pp_scoring_evaluations_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "BP_PF_v7pp_scoring_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_evaluations" ADD CONSTRAINT "BP_PF_v7pp_scoring_evaluations_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_evaluation_answers" ADD CONSTRAINT "BP_PF_v7pp_evaluation_answers_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_evaluation_answers" ADD CONSTRAINT "BP_PF_v7pp_evaluation_answers_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_evaluation_answers" ADD CONSTRAINT "BP_PF_v7pp_evaluation_answers_sourceBindingId_fkey" FOREIGN KEY ("sourceBindingId") REFERENCES "BP_PF_v7pp_node_data_bindings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_evaluation_node_results" ADD CONSTRAINT "BP_PF_v7pp_evaluation_node_results_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_evaluation_node_results" ADD CONSTRAINT "BP_PF_v7pp_evaluation_node_results_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_change_logs" ADD CONSTRAINT "BP_PF_v7pp_change_logs_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "BP_PF_v7pp_scoring_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_change_logs" ADD CONSTRAINT "BP_PF_v7pp_change_logs_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BP_PF_v7pp_scoring_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_change_logs" ADD CONSTRAINT "BP_PF_v7pp_change_logs_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_change_logs" ADD CONSTRAINT "BP_PF_v7pp_change_logs_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_field_configurations" ADD CONSTRAINT "BP_PF_field_configurations_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BP_PF_form_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_scoring_thresholds" ADD CONSTRAINT "BP_PF_scoring_thresholds_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_scoring_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_scoring_options" ADD CONSTRAINT "BP_PF_scoring_options_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_scoring_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_subsectors" ADD CONSTRAINT "BP_PF_subsectors_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "BP_PF_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_workflows" ADD CONSTRAINT "BP_PF_v7pp_scoring_workflows_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_workflow_steps" ADD CONSTRAINT "BP_PF_v7pp_scoring_workflow_steps_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "BP_PF_v7pp_scoring_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_decisions" ADD CONSTRAINT "BP_PF_v7pp_scoring_decisions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "BP_PF_v7pp_scoring_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_decisions" ADD CONSTRAINT "BP_PF_v7pp_scoring_decisions_decidedBy_fkey" FOREIGN KEY ("decidedBy") REFERENCES "BP_PF_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_overrides" ADD CONSTRAINT "BP_PF_v7pp_scoring_overrides_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_overrides" ADD CONSTRAINT "BP_PF_v7pp_scoring_overrides_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_overrides" ADD CONSTRAINT "BP_PF_v7pp_scoring_overrides_overriddenBy_fkey" FOREIGN KEY ("overriddenBy") REFERENCES "BP_PF_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_overrides" ADD CONSTRAINT "BP_PF_v7pp_scoring_overrides_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_documents" ADD CONSTRAINT "BP_PF_v7pp_scoring_documents_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "BP_PF_v7pp_scoring_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_documents" ADD CONSTRAINT "BP_PF_v7pp_scoring_documents_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BP_PF_v7pp_scoring_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_documents" ADD CONSTRAINT "BP_PF_v7pp_scoring_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "BP_PF_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_documents" ADD CONSTRAINT "BP_PF_v7pp_scoring_documents_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_comments" ADD CONSTRAINT "BP_PF_v7pp_scoring_comments_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "BP_PF_v7pp_scoring_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_comments" ADD CONSTRAINT "BP_PF_v7pp_scoring_comments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "BP_PF_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_comments" ADD CONSTRAINT "BP_PF_v7pp_scoring_comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "BP_PF_v7pp_scoring_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_approvals" ADD CONSTRAINT "BP_PF_v7pp_scoring_approvals_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "BP_PF_v7pp_scoring_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v7pp_scoring_approvals" ADD CONSTRAINT "BP_PF_v7pp_scoring_approvals_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "BP_PF_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v9_sector_thresholds" ADD CONSTRAINT "BP_PF_v9_sector_thresholds_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "BP_PF_v9_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v9_sector_domain_weights" ADD CONSTRAINT "BP_PF_v9_sector_domain_weights_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "BP_PF_v9_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v9_red_flags" ADD CONSTRAINT "BP_PF_v9_red_flags_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "BP_PF_v9_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v9_indicators" ADD CONSTRAINT "BP_PF_v9_indicators_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "BP_PF_v9_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_v9_stress_tests" ADD CONSTRAINT "BP_PF_v9_stress_tests_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "BP_PF_v9_sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BP_PF_app_config_history" ADD CONSTRAINT "BP_PF_app_config_history_key_fkey" FOREIGN KEY ("key") REFERENCES "BP_PF_app_configuration"("key") ON DELETE CASCADE ON UPDATE CASCADE;
