-- Add archiving and versioning support to evaluations
ALTER TABLE "BP_PF_v7pp_evaluations" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BP_PF_v7pp_evaluations" ADD COLUMN "versionNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "BP_PF_v7pp_evaluations" ADD COLUMN "parentEvaluationId" TEXT;
ALTER TABLE "BP_PF_v7pp_evaluations" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "BP_PF_v7pp_evaluations" ADD COLUMN "archivedBy" TEXT;

-- Add foreign key constraint for parent evaluation (self-referencing)
ALTER TABLE "BP_PF_v7pp_evaluations" ADD CONSTRAINT "BP_PF_v7pp_evaluations_parentEvaluationId_fkey" FOREIGN KEY ("parentEvaluationId") REFERENCES "BP_PF_v7pp_evaluations" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "BP_PF_v7pp_evaluations_isArchived_idx" ON "BP_PF_v7pp_evaluations"("isArchived");
CREATE INDEX "BP_PF_v7pp_evaluations_parentEvaluationId_idx" ON "BP_PF_v7pp_evaluations"("parentEvaluationId");
