-- Migration: Add Flexible Scoring Configuration
-- Purpose: Enable configurable scoring at different hierarchy levels
-- Date: 2026-04-18

-- Add new columns to ScoringNode for flexible scoring levels
ALTER TABLE "BP_PF_v7pp_scoring_nodes"
ADD COLUMN "scoreLeafDepth" INTEGER DEFAULT NULL,
ADD COLUMN "isScoringLeaf" BOOLEAN DEFAULT false;

-- Initialize with current configuration (depth 1 = scoring level)
-- All CRITERION nodes are scoring leaves by default
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 1,
    "isScoringLeaf" = ("nodeType" = 'CRITERION' AND "depth" = 1);

-- For DOMAIN nodes, scoreLeafDepth = 1 means score at criterion level
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 1
WHERE "nodeType" = 'DOMAIN' AND "scoreLeafDepth" IS NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN "BP_PF_v7pp_scoring_nodes"."scoreLeafDepth" IS
'Depth at which scoring should be captured. 0=this node, 1=children, 2+=grandchildren. Null means inherited from parent.';

COMMENT ON COLUMN "BP_PF_v7pp_scoring_nodes"."isScoringLeaf" IS
'True if this node is a scoring input point. Determined by depth and scoreLeafDepth configuration.';

-- Create index for performance when querying scoring leaves
CREATE INDEX "IX_ScoringNode_ScoringLeaf" ON "BP_PF_v7pp_scoring_nodes"("versionId", "isScoringLeaf")
WHERE "isActive" = true;
