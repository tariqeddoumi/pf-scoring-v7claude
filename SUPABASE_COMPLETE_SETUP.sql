-- ============================================================================
-- PF SCORING V7PP - COMPLETE SETUP SCRIPT FOR SUPABASE / POSTGRESQL
-- ============================================================================
--
-- This script contains all tables, migrations, and default configuration data
-- for the PF Scoring v7pp system.
--
-- Compatible with:
-- - Supabase (PostgreSQL 15+)
-- - PostgreSQL 12+
--
-- Usage:
-- 1. Copy entire script
-- 2. Paste into Supabase SQL Editor (or psql)
-- 3. Execute - all operations are idempotent and safe to run multiple times
--
-- Date: 2026-04-18
-- Version: 1.0.0
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: CONFIGURATION TABLES (PARAMETRIZABLE)
-- Database-driven configuration - NO hardcoded values in code
-- ============================================================================

-- TABLE: Answer Types
-- Defines all supported answer input types (OPTION_SINGLE, NUMERIC_RANGE, etc.)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_answer_types" (
  id              VARCHAR(50)  PRIMARY KEY,
  label           VARCHAR(100),
  description     TEXT,
  "requiresOptions"   BOOLEAN DEFAULT false,
  "requiresRanges"    BOOLEAN DEFAULT false,
  "supportsMultiple"  BOOLEAN DEFAULT false,
  "minValue"      FLOAT,
  "maxValue"      FLOAT,
  "uiComponent"   VARCHAR(100),
  "isActive"      BOOLEAN DEFAULT true,
  "displayOrder"  INT DEFAULT 0,
  "createdAt"     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_answer_types_active" ON "BP_PF_v7pp_answer_types"("isActive");

-- TABLE: Aggregation Methods
-- Defines how to combine child scores (AVERAGE, SUM, WEIGHTED_AVERAGE, etc.)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_aggregation_methods" (
  id              VARCHAR(50) PRIMARY KEY,
  label           VARCHAR(100),
  description     TEXT,
  formula         TEXT,
  "requiresWeights" BOOLEAN DEFAULT false,
  "isActive"      BOOLEAN DEFAULT true,
  "displayOrder"  INT DEFAULT 0,
  "createdAt"     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_aggregation_methods_active" ON "BP_PF_v7pp_aggregation_methods"("isActive");

-- TABLE: Weight Modes
-- Defines how weights are applied (RELATIVE, ABSOLUTE, NONE)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_weight_modes" (
  id              VARCHAR(50) PRIMARY KEY,
  label           VARCHAR(100),
  description     TEXT,
  "isActive"      BOOLEAN DEFAULT true,
  "displayOrder"  INT DEFAULT 0,
  "createdAt"     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_weight_modes_active" ON "BP_PF_v7pp_weight_modes"("isActive");

-- TABLE: Score Scales
-- Defines available score ranges (0-100, 0-10, 1-5, 0-1)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_score_scales" (
  id              VARCHAR(50) PRIMARY KEY,
  label           VARCHAR(100),
  description     TEXT,
  "minScore"      FLOAT,
  "maxScore"      FLOAT,
  "isActive"      BOOLEAN DEFAULT true,
  "displayOrder"  INT DEFAULT 0,
  "createdAt"     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_score_scales_active" ON "BP_PF_v7pp_score_scales"("isActive");

-- TABLE: Rating Scales
-- Defines final rating grades (AAA, AA, A, BBB, ... D)
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_rating_scales" (
  id              VARCHAR(50) PRIMARY KEY,
  label           VARCHAR(10),
  description     TEXT,
  "minScore"      FLOAT,
  "maxScore"      FLOAT,
  color           VARCHAR(20),
  "displayOrder"  INT DEFAULT 0,
  "createdAt"     TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_rating_scales_order" ON "BP_PF_v7pp_rating_scales"("displayOrder");

-- ============================================================================
-- PART 2: DATA BINDING & EXECUTION TRACKING TABLE
-- Tracks data lineage, auto-fill, overrides, transformations
-- ============================================================================

-- TABLE: ScoringNodeDataBinding
-- Maps scoring nodes to source data entities
-- Supports: auto-fill from BUDGET_LINE, FINANCIAL_DATA, SECTOR, etc.
-- Supports: data transformations, fallbacks, override tracking
CREATE TABLE IF NOT EXISTS "BP_PF_v7pp_node_data_bindings" (
    "id"                      TEXT NOT NULL PRIMARY KEY,
    "nodeId"                  TEXT NOT NULL,
    "sourceEntity"            TEXT NOT NULL,
    "sourceField"             TEXT,
    "sourcePath"              TEXT,
    "bindingMode"             TEXT NOT NULL DEFAULT 'AUTO_EDITABLE',
    "dataType"                TEXT,
    "transformType"           TEXT NOT NULL DEFAULT 'NONE',
    "transformConfigJson"     TEXT,
    "defaultValue"            TEXT,
    "fallbackValue"           TEXT,
    "fallbackMessage"         TEXT,
    "isRequired"              BOOLEAN NOT NULL DEFAULT false,
    "isReadOnly"              BOOLEAN NOT NULL DEFAULT false,
    "allowOverride"           BOOLEAN NOT NULL DEFAULT true,
    "overrideRequiresReason"  BOOLEAN NOT NULL DEFAULT false,
    "priority"                INTEGER NOT NULL DEFAULT 100,
    "isActive"                BOOLEAN NOT NULL DEFAULT true,
    "description"             TEXT,
    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BP_PF_v7pp_node_data_bindings_nodeId_fkey"
        FOREIGN KEY ("nodeId")
        REFERENCES "BP_PF_v7pp_scoring_nodes" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_node_data_bindings_nodeId_idx"        ON "BP_PF_v7pp_node_data_bindings"("nodeId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_node_data_bindings_sourceEntity_idx"  ON "BP_PF_v7pp_node_data_bindings"("sourceEntity");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_node_data_bindings_bindingMode_idx"   ON "BP_PF_v7pp_node_data_bindings"("bindingMode");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_node_data_bindings_isActive_idx"      ON "BP_PF_v7pp_node_data_bindings"("isActive");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_node_data_bindings_priority_idx"      ON "BP_PF_v7pp_node_data_bindings"("priority");

-- ============================================================================
-- PART 3: ENRICH EVALUATION ANSWER TABLE WITH EXECUTION TRACKING
-- Complete audit trail: who did what, when, why, with what value
-- ============================================================================

ALTER TABLE "BP_PF_v7pp_evaluation_answers"
    ADD COLUMN IF NOT EXISTS "sourceType"                TEXT,
    ADD COLUMN IF NOT EXISTS "sourceEntity"              TEXT,
    ADD COLUMN IF NOT EXISTS "sourceField"               TEXT,
    ADD COLUMN IF NOT EXISTS "sourcePath"                TEXT,
    ADD COLUMN IF NOT EXISTS "sourceBindingId"           TEXT,
    ADD COLUMN IF NOT EXISTS "sourceValueSnapshotJson"   TEXT,
    ADD COLUMN IF NOT EXISTS "resolvedValueSnapshotJson" TEXT,
    ADD COLUMN IF NOT EXISTS "isAutoFilled"              BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "isOverridden"              BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "overrideReason"            TEXT,
    ADD COLUMN IF NOT EXISTS "overriddenBy"              TEXT,
    ADD COLUMN IF NOT EXISTS "overriddenAt"              TIMESTAMP(3);

-- Add foreign key constraint for data binding reference
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'BP_PF_v7pp_evaluation_answers_sourceBindingId_fkey'
    ) THEN
        ALTER TABLE "BP_PF_v7pp_evaluation_answers"
        ADD CONSTRAINT "BP_PF_v7pp_evaluation_answers_sourceBindingId_fkey"
        FOREIGN KEY ("sourceBindingId")
        REFERENCES "BP_PF_v7pp_node_data_bindings" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluation_answers_sourceBindingId_idx"
    ON "BP_PF_v7pp_evaluation_answers"("sourceBindingId");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluation_answers_sourceType_idx"
    ON "BP_PF_v7pp_evaluation_answers"("sourceType");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluation_answers_isAutoFilled_idx"
    ON "BP_PF_v7pp_evaluation_answers"("isAutoFilled");
CREATE INDEX IF NOT EXISTS "BP_PF_v7pp_evaluation_answers_isOverridden_idx"
    ON "BP_PF_v7pp_evaluation_answers"("isOverridden");

-- ============================================================================
-- PART 4: FLEXIBLE SCORING CONFIGURATION
-- Enable configurable scoring at different hierarchy levels
-- ============================================================================

ALTER TABLE "BP_PF_v7pp_scoring_nodes"
ADD COLUMN IF NOT EXISTS "scoreLeafDepth" INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "isScoringLeaf" BOOLEAN DEFAULT false;

-- Initialize with current configuration (depth 1 = scoring level)
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 1,
    "isScoringLeaf" = ("nodeType" = 'CRITERION' AND "depth" = 1)
WHERE "scoreLeafDepth" IS NULL;

-- For DOMAIN nodes, scoreLeafDepth = 1 means score at criterion level
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 1
WHERE "nodeType" = 'DOMAIN' AND "scoreLeafDepth" IS NULL;

-- Create index for performance when querying scoring leaves
CREATE INDEX IF NOT EXISTS "IX_ScoringNode_ScoringLeaf" ON "BP_PF_v7pp_scoring_nodes"("versionId", "isScoringLeaf")
WHERE "isActive" = true;

-- ============================================================================
-- PART 5: MODEL-LEVEL CONFIGURATION
-- Allow each scoring model version to have default aggregation/weight/scale
-- ============================================================================

ALTER TABLE "BP_PF_v7pp_scoring_versions"
ADD COLUMN IF NOT EXISTS "aggregationMethod" VARCHAR(50) DEFAULT 'WEIGHTED_AVERAGE',
ADD COLUMN IF NOT EXISTS "weightMode" VARCHAR(50) DEFAULT 'RELATIVE',
ADD COLUMN IF NOT EXISTS "scoreScale" VARCHAR(50) DEFAULT '0_100';

-- ============================================================================
-- PART 6: DEFAULT CONFIGURATION DATA
-- Populate configuration tables with standard values (idempotent)
-- ============================================================================

INSERT INTO "BP_PF_v7pp_answer_types"
  (id, label, description, "requiresOptions", "requiresRanges", "uiComponent", "displayOrder")
VALUES
  ('OPTION_SINGLE',  'Option unique',     'Choisir une option dans une liste',      true,  false, 'select',        1),
  ('OPTION_MULTI',   'Options multiples', 'Choisir plusieurs options',              true,  false, 'checkbox',      2),
  ('NUMERIC_RANGE',  'Plage numérique',   'Valeur numérique avec plages de score',  false, true,  'input[number]', 3),
  ('BOOLEAN',        'Oui / Non',         'Question oui/non simple',                false, false, 'radio',         4),
  ('TEXT',           'Texte libre',       'Saisie libre (non scorée)',              false, false, 'textarea',      5),
  ('NUMERIC',        'Nombre',            'Nombre simple (sans plages)',            false, false, 'input[number]', 6)
ON CONFLICT (id) DO UPDATE SET
  label           = EXCLUDED.label,
  description     = EXCLUDED.description,
  "displayOrder"  = EXCLUDED."displayOrder";

INSERT INTO "BP_PF_v7pp_aggregation_methods"
  (id, label, description, formula, "requiresWeights", "displayOrder")
VALUES
  ('AVERAGE',          'Moyenne simple',     'Moyenne de tous les scores enfants',            'sum(scores) / count',                false, 1),
  ('WEIGHTED_AVERAGE', 'Moyenne pondérée',   'Moyenne pondérée par les poids des enfants',   'sum(score x weight) / sum(weights)', true,  2),
  ('SUM',              'Somme',              'Somme de tous les scores enfants',              'sum(scores)',                        false, 3),
  ('MIN',              'Minimum',            'Score minimal (plus conservateur)',             'min(scores)',                        false, 4),
  ('MAX',              'Maximum',            'Score maximal (plus optimiste)',                'max(scores)',                        false, 5),
  ('FIRST',            'Premier uniquement', 'Utiliser uniquement le premier score enfant',  'first(scores)',                      false, 6)
ON CONFLICT (id) DO UPDATE SET
  label           = EXCLUDED.label,
  description     = EXCLUDED.description,
  "displayOrder"  = EXCLUDED."displayOrder";

INSERT INTO "BP_PF_v7pp_weight_modes"
  (id, label, description, "displayOrder")
VALUES
  ('RELATIVE', 'Poids relatif',     'Poids en pourcentage du total (somme = 1.0)', 1),
  ('ABSOLUTE', 'Poids absolu',      'Valeur de poids fixe',                        2),
  ('NONE',     'Sans pondération',  'Poids égal pour tous les enfants',            3)
ON CONFLICT (id) DO UPDATE SET
  label           = EXCLUDED.label,
  "displayOrder"  = EXCLUDED."displayOrder";

INSERT INTO "BP_PF_v7pp_score_scales"
  (id, label, "minScore", "maxScore", "displayOrder")
VALUES
  ('0_100', 'Score 0-100', 0, 100, 1),
  ('0_10',  'Score 0-10',  0,  10, 2),
  ('1_5',   'Score 1-5',   1,   5, 3),
  ('0_1',   'Score 0-1',   0,   1, 4)
ON CONFLICT (id) DO UPDATE SET
  label           = EXCLUDED.label,
  "displayOrder"  = EXCLUDED."displayOrder";

INSERT INTO "BP_PF_v7pp_rating_scales"
  (id, label, "minScore", "maxScore", color, "displayOrder")
VALUES
  ('AAA', 'AAA', 95,    100,   'green-600',  1),
  ('AA',  'AA',  90,    94.99, 'green-500',  2),
  ('A',   'A',   85,    89.99, 'green-400',  3),
  ('BBB', 'BBB', 75,    84.99, 'blue-500',   4),
  ('BB',  'BB',  65,    74.99, 'blue-400',   5),
  ('B',   'B',   55,    64.99, 'yellow-500', 6),
  ('CCC', 'CCC', 45,    54.99, 'orange-500', 7),
  ('CC',  'CC',  35,    44.99, 'orange-400', 8),
  ('C',   'C',   25,    34.99, 'red-500',    9),
  ('D',   'D',   0,     24.99, 'red-600',    10)
ON CONFLICT (id) DO UPDATE SET
  "minScore"      = EXCLUDED."minScore",
  "maxScore"      = EXCLUDED."maxScore",
  color           = EXCLUDED.color,
  "displayOrder"  = EXCLUDED."displayOrder";

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the setup was successful
-- ============================================================================

-- Count configuration records
SELECT 'Answer Types' as type, COUNT(*) as count FROM "BP_PF_v7pp_answer_types"
UNION ALL
SELECT 'Aggregation Methods', COUNT(*) FROM "BP_PF_v7pp_aggregation_methods"
UNION ALL
SELECT 'Weight Modes', COUNT(*) FROM "BP_PF_v7pp_weight_modes"
UNION ALL
SELECT 'Score Scales', COUNT(*) FROM "BP_PF_v7pp_score_scales"
UNION ALL
SELECT 'Rating Scales', COUNT(*) FROM "BP_PF_v7pp_rating_scales";

-- Verify table structure
SELECT 'Node Data Bindings table exists' as check FROM information_schema.tables
WHERE table_name = 'BP_PF_v7pp_node_data_bindings'
UNION ALL
SELECT 'Answer tracking columns exist' FROM information_schema.columns
WHERE table_name = 'BP_PF_v7pp_evaluation_answers' AND column_name = 'isAutoFilled'
UNION ALL
SELECT 'Flexible scoring columns exist' FROM information_schema.columns
WHERE table_name = 'BP_PF_v7pp_scoring_nodes' AND column_name = 'isScoringLeaf'
UNION ALL
SELECT 'Model config columns exist' FROM information_schema.columns
WHERE table_name = 'BP_PF_v7pp_scoring_versions' AND column_name = 'aggregationMethod';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
--
-- The following features are now available:
--
-- 1. DATABASE-DRIVEN CONFIGURATION
--    - All answer types, aggregation methods, weight modes, score scales,
--      rating scales are in database tables
--    - Fully editable via admin API endpoints
--    - No hardcoded values in application code
--
-- 2. FLEXIBLE SCORING ARCHITECTURE
--    - scoreLeafDepth: Configure at which hierarchy level scoring occurs
--    - isScoringLeaf: Mark nodes as scoring input points
--    - Support for domain-level, criterion-level, or sub-criterion-level scoring
--    - Mixed configurations possible across different branches
--
-- 3. EXECUTION TRACKING
--    - Data binding configuration (source entity, field, transformations)
--    - Auto-fill tracking (isAutoFilled flag)
--    - Override management (isOverridden, overrideReason, overriddenBy, overriddenAt)
--    - Value snapshots (sourceValueSnapshotJson, resolvedValueSnapshotJson)
--    - Complete audit trail for compliance
--
-- 4. MODEL CONFIGURATION
--    - Each scoring model version can have default:
--      * aggregationMethod (how to combine scores)
--      * weightMode (how weights apply)
--      * scoreScale (score range)
--
-- API ENDPOINTS AVAILABLE:
-- - GET  /api/admin/scoring/configuration?type=answerTypes|aggregationMethods|weightModes|scoreScales|ratingScales
-- - GET  /api/admin/scoring/model-config?versionId=X
-- - PUT  /api/admin/scoring/model-config?versionId=X
-- - POST /api/admin/scoring/options (add options to criteria)
-- - POST /api/admin/scoring/ranges (add numeric ranges)
--
-- NEXT STEPS:
-- 1. Verify counts in verification queries above
-- 2. Access admin builder at /app/admin/scoring/builder
-- 3. Configure answer types, aggregation methods, weight modes
-- 4. Set scoreLeafDepth for flexible scoring
-- 5. Create data bindings for auto-fill functionality
--
-- PRODUCTION DEPLOYMENT:
-- - This script is production-ready
-- - All operations are idempotent (safe to run multiple times)
-- - Fully compatible with Supabase and PostgreSQL 12+
-- - No down-time required (uses IF NOT EXISTS, ADD COLUMN IF NOT EXISTS)
-- ============================================================================

COMMIT;
