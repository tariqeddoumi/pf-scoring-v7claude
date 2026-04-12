-- Create ScoringCriterion table for individual scoring criteria
CREATE TABLE "BP_PF_scoring_criteria" (
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

-- Create ScoringThreshold table for score ranges
CREATE TABLE "BP_PF_scoring_thresholds" (
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
    CONSTRAINT "BP_PF_scoring_thresholds_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_scoring_criteria" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ScoringOption table for predefined options
CREATE TABLE "BP_PF_scoring_options" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "criterionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_scoring_options_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "BP_PF_scoring_criteria" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ScoringGrille table for scoring grid templates
CREATE TABLE "BP_PF_scoring_grilles" (
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

-- Create ScoringWeightingRule table for weight management
CREATE TABLE "BP_PF_scoring_weighting_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grilleCode" TEXT NOT NULL,
    "criterionCode" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "applicableToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_scoring_weighting_rules_grilleCode_criterionCode_key" UNIQUE("grilleCode", "criterionCode")
);

-- Create indexes for performance
CREATE INDEX "BP_PF_scoring_criteria_category_idx" ON "BP_PF_scoring_criteria"("category");
CREATE INDEX "BP_PF_scoring_criteria_isActive_idx" ON "BP_PF_scoring_criteria"("isActive");
CREATE INDEX "BP_PF_scoring_criteria_orderIndex_idx" ON "BP_PF_scoring_criteria"("orderIndex");

CREATE INDEX "BP_PF_scoring_thresholds_criterionId_idx" ON "BP_PF_scoring_thresholds"("criterionId");
CREATE INDEX "BP_PF_scoring_thresholds_orderIndex_idx" ON "BP_PF_scoring_thresholds"("orderIndex");

CREATE INDEX "BP_PF_scoring_options_criterionId_idx" ON "BP_PF_scoring_options"("criterionId");
CREATE INDEX "BP_PF_scoring_options_orderIndex_idx" ON "BP_PF_scoring_options"("orderIndex");

CREATE INDEX "BP_PF_scoring_grilles_status_idx" ON "BP_PF_scoring_grilles"("status");
CREATE INDEX "BP_PF_scoring_grilles_isActive_idx" ON "BP_PF_scoring_grilles"("isActive");
CREATE INDEX "BP_PF_scoring_grilles_isDefault_idx" ON "BP_PF_scoring_grilles"("isDefault");

CREATE INDEX "BP_PF_scoring_weighting_rules_grilleCode_idx" ON "BP_PF_scoring_weighting_rules"("grilleCode");
