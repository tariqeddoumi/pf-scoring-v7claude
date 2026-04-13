-- Make analystId nullable in evaluations table
ALTER TABLE "BP_PF_v7pp_evaluations" ALTER COLUMN "analystId" DROP NOT NULL;
