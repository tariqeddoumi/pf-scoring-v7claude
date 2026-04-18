-- Add configuration fields to ScoringModelVersion
-- These fields allow parameterizing model-level settings

ALTER TABLE "BP_PF_v7pp_scoring_versions"
ADD COLUMN "aggregationMethod" VARCHAR(50) DEFAULT 'WEIGHTED_AVERAGE',
ADD COLUMN "weightMode" VARCHAR(50) DEFAULT 'RELATIVE',
ADD COLUMN "scoreScale" VARCHAR(50) DEFAULT '0_100';

-- Add comments to explain the fields
COMMENT ON COLUMN "BP_PF_v7pp_scoring_versions"."aggregationMethod" IS
'Default aggregation method for the model. Values: AVERAGE, WEIGHTED_AVERAGE, SUM, MIN, MAX, FIRST';

COMMENT ON COLUMN "BP_PF_v7pp_scoring_versions"."weightMode" IS
'Default weight mode for the model. Values: RELATIVE, ABSOLUTE, NONE';

COMMENT ON COLUMN "BP_PF_v7pp_scoring_versions"."scoreScale" IS
'Default score scale for the model. Values: 0_100, 0_10, 1_5, 0_1';
