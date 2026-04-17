-- =====================================================================
-- Migration: Add ScoringNodeDataBinding table and enrich answers
-- Date: 2026-04-17
-- Context: Scoring refactoring - source tracking & data bindings
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Create ScoringNodeDataBinding table
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 2. Enrich ScoringEvaluationAnswer with source-tracking fields
-- ---------------------------------------------------------------------
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

-- FK from answer → binding (nullable, SET NULL on binding delete)
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
