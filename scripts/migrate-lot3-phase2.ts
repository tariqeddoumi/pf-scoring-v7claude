/**
 * Lot 3 Phase 2: Data Migration Script
 *
 * Migrates existing ScoringEvaluation records to initialize:
 * 1. ScoringWorkflow (one per evaluation, status derived from evaluation.status)
 * 2. Default ScoringWorkflowStep entries (analyst review step)
 *
 * Safe to run multiple times (idempotent via upsert).
 *
 * Usage:
 *   npx tsx scripts/migrate-lot3-phase2.ts
 *   npx tsx scripts/migrate-lot3-phase2.ts --dry-run
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");

// Maps legacy EvaluationStatus enum to workflow status string
function evaluationStatusToWorkflowStatus(
  status: string
): "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" {
  const map: Record<string, "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"> = {
    brouillon: "DRAFT",
    en_cours: "DRAFT",
    soumis: "SUBMITTED",
    en_revue: "UNDER_REVIEW",
    valide: "APPROVED",
    approuve: "APPROVED",
    rejete: "REJECTED",
    archive: "APPROVED", // archived = previously approved
  };
  return map[status] ?? "DRAFT";
}

// Determines whether the evaluation requires risk manager review based on score
function requiresRiskReview(finalScore: number | null): boolean {
  if (finalScore === null) return true;
  // High-risk evaluations (score < 60) require risk manager review
  return finalScore < 60;
}

async function migrateWorkflows() {
  console.log(`\n=== Lot 3 Phase 2: Data Migration ${DRY_RUN ? "[DRY RUN]" : ""} ===\n`);

  // Fetch all evaluations that don't yet have a workflow
  const evaluations = await prisma.scoringEvaluation.findMany({
    where: {
      workflow: null,
    },
    select: {
      id: true,
      status: true,
      finalScore: true,
      analystId: true,
      submittedAt: true,
      validatedAt: true,
      approvedAt: true,
      createdAt: true,
    },
  });

  console.log(`Found ${evaluations.length} evaluations without a workflow.\n`);

  if (evaluations.length === 0) {
    console.log("Nothing to migrate.");
    return;
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const evaluation of evaluations) {
    try {
      const workflowStatus = evaluationStatusToWorkflowStatus(evaluation.status);
      const needsRiskReview = requiresRiskReview(evaluation.finalScore);

      // Derive workflow timestamps from evaluation timestamps
      const submittedAt = evaluation.submittedAt;
      const approvedAt =
        workflowStatus === "APPROVED" ? (evaluation.approvedAt ?? evaluation.validatedAt) : null;
      const reviewStartedAt =
        workflowStatus === "UNDER_REVIEW" || workflowStatus === "APPROVED"
          ? submittedAt
          : null;
      const reviewCompletedAt =
        workflowStatus === "APPROVED" ? approvedAt : null;

      if (DRY_RUN) {
        console.log(
          `[DRY] Would create workflow for evaluation ${evaluation.id}: status=${workflowStatus}, riskReview=${needsRiskReview}`
        );
        created++;
        continue;
      }

      // Create workflow
      const workflow = await prisma.scoringWorkflow.create({
        data: {
          evaluationId: evaluation.id,
          status: workflowStatus,
          currentStep: workflowStatus === "DRAFT" ? 0 : workflowStatus === "SUBMITTED" ? 1 : workflowStatus === "UNDER_REVIEW" ? 2 : 3,
          requiresRiskManagerReview: needsRiskReview,
          requiresCommitteeApproval: (evaluation.finalScore ?? 100) < 40, // committee for very high risk
          submittedAt,
          submittedBy: evaluation.analystId ?? undefined,
          reviewStartedAt: reviewStartedAt ?? undefined,
          reviewCompletedAt: reviewCompletedAt ?? undefined,
          approvedAt: approvedAt ?? undefined,
          createdAt: evaluation.createdAt,
        },
      });

      // Create default workflow steps
      const defaultSteps = buildDefaultSteps(workflow.id, workflowStatus, needsRiskReview);

      await prisma.scoringWorkflowStep.createMany({
        data: defaultSteps,
        skipDuplicates: true,
      });

      created++;
      process.stdout.write(`\r  Progress: ${created + skipped + errors}/${evaluations.length}`);
    } catch (err: any) {
      errors++;
      console.error(`\nFailed for evaluation ${evaluation.id}: ${err.message}`);
    }
  }

  console.log(`\n\n=== Migration Complete ===`);
  console.log(`  Created: ${created} workflows`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
}

function buildDefaultSteps(
  workflowId: string,
  workflowStatus: string,
  needsRiskReview: boolean
) {
  const now = new Date();

  type StepData = {
    id: string;
    workflowId: string;
    stepNumber: number;
    stepName: string;
    stepType: string;
    description: string;
    status: string;
    startedAt: Date | undefined;
    completedAt: Date | undefined;
  };

  const steps: StepData[] = [
    {
      id: `${workflowId}-step-1`,
      workflowId,
      stepNumber: 1,
      stepName: "Saisie et vérification analyste",
      stepType: "ANALYST_REVIEW",
      description: "L'analyste remplit et vérifie toutes les données de l'évaluation.",
      status: workflowStatus === "DRAFT" ? "IN_PROGRESS" : "COMPLETED",
      startedAt: now,
      completedAt: workflowStatus !== "DRAFT" ? now : undefined,
    },
  ];

  if (needsRiskReview) {
    steps.push({
      id: `${workflowId}-step-2`,
      workflowId,
      stepNumber: 2,
      stepName: "Revue Risk Manager",
      stepType: "RISK_REVIEW",
      description: "Le risk manager examine et valide les résultats du scoring.",
      status:
        workflowStatus === "UNDER_REVIEW"
          ? "IN_PROGRESS"
          : workflowStatus === "APPROVED"
          ? "COMPLETED"
          : "PENDING",
      startedAt: workflowStatus === "UNDER_REVIEW" || workflowStatus === "APPROVED" ? now : undefined,
      completedAt: workflowStatus === "APPROVED" ? now : undefined,
    });
  }

  steps.push({
    id: `${workflowId}-step-3`,
    workflowId,
    stepNumber: steps.length + 1,
    stepName: "Décision finale",
    stepType: "FINAL_APPROVAL",
    description: "Approbation finale et génération du rapport de scoring.",
    status: workflowStatus === "APPROVED" ? "COMPLETED" : "PENDING",
    startedAt: workflowStatus === "APPROVED" ? now : undefined,
    completedAt: workflowStatus === "APPROVED" ? now : undefined,
  });

  return steps;
}

async function verifyMigration() {
  console.log("\n=== Verification ===\n");

  const [totalEvaluations, totalWorkflows, workflowsByStatus] = await Promise.all([
    prisma.scoringEvaluation.count(),
    prisma.scoringWorkflow.count(),
    prisma.scoringWorkflow.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  console.log(`Total evaluations:  ${totalEvaluations}`);
  console.log(`Total workflows:    ${totalWorkflows}`);
  console.log(`Coverage:           ${((totalWorkflows / Math.max(totalEvaluations, 1)) * 100).toFixed(1)}%`);
  console.log("\nWorkflows by status:");
  for (const entry of workflowsByStatus) {
    console.log(`  ${entry.status.padEnd(15)} ${entry._count}`);
  }

  const evaluationsWithoutWorkflow = await prisma.scoringEvaluation.count({
    where: { workflow: null },
  });

  if (evaluationsWithoutWorkflow > 0) {
    console.warn(
      `\nWARNING: ${evaluationsWithoutWorkflow} evaluations still have no workflow.`
    );
  } else {
    console.log("\nAll evaluations have a workflow. Migration successful.");
  }
}

async function main() {
  try {
    await migrateWorkflows();
    if (!DRY_RUN) {
      await verifyMigration();
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
